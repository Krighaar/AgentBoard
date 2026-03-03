import { spawn, type ChildProcess, execSync } from "child_process";
import { EventEmitter } from "events";
import { prisma } from "./db";
import { emitEvent } from "./event-emitter";

// Cost per million tokens (approximate, Sonnet 4 as default)
const COST_PER_M_INPUT = 3.0;
const COST_PER_M_OUTPUT = 15.0;

export class AgentProcess extends EventEmitter {
  private process: ChildProcess | null = null;
  private taskId: string;
  private killed = false;
  private logBuffer: Array<{ stream: string; content: string }> = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private inputTokens = 0;
  private outputTokens = 0;

  constructor(taskId: string) {
    super();
    this.taskId = taskId;
  }

  async start(prompt: string, cwd?: string) {
    // Strip CLAUDECODE env var to avoid nested session error
    const env = { ...process.env };
    delete env.CLAUDECODE;
    // Also strip common Claude session markers
    for (const key of Object.keys(env)) {
      if (key.startsWith("CLAUDE_")) {
        delete env[key];
      }
    }

    const args = [
      "-p",
      "--output-format",
      "stream-json",
      "--verbose",
      "--max-turns",
      "50",
      "--permission-mode",
      "bypassPermissions",
    ];

    this.process = spawn("claude", args, {
      env,
      cwd: cwd || process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });

    // Write prompt via stdin to avoid shell mangling of multiline strings
    this.process.stdin?.write(prompt);
    this.process.stdin?.end();

    await this.writeLog("system", `Agent started (PID: ${this.process.pid})`);

    // Start log buffer flush timer (500ms batches)
    this.flushTimer = setInterval(() => this.flushLogs(), 500);

    this.process.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      // Parse stream-json lines
      for (const line of text.split("\n").filter(Boolean)) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.type === "assistant" && parsed.message?.content) {
            for (const block of parsed.message.content) {
              if (block.type === "text" && block.text) {
                this.bufferLog("stdout", block.text);
              }
              if (block.type === "tool_use") {
                this.bufferLog(
                  "stdout",
                  `[Tool: ${block.name}] ${JSON.stringify(block.input).slice(0, 200)}`
                );
              }
            }
            // Extract usage from assistant messages
            if (parsed.message?.usage) {
              this.inputTokens += parsed.message.usage.input_tokens ?? 0;
              this.outputTokens += parsed.message.usage.output_tokens ?? 0;
            }
          } else if (parsed.type === "result") {
            if (parsed.result) {
              this.bufferLog("stdout", parsed.result);
            }
            // Extract usage from result
            if (parsed.usage) {
              this.inputTokens += parsed.usage.input_tokens ?? 0;
              this.outputTokens += parsed.usage.output_tokens ?? 0;
            }
            // Also check total_usage in result
            if (parsed.total_usage) {
              // total_usage is cumulative — replace instead of add
              this.inputTokens = parsed.total_usage.input_tokens ?? this.inputTokens;
              this.outputTokens = parsed.total_usage.output_tokens ?? this.outputTokens;
            }
          }
        } catch {
          // Not JSON, log raw
          if (line.trim()) {
            this.bufferLog("stdout", line);
          }
        }
      }
    });

    this.process.stderr?.on("data", (data: Buffer) => {
      const text = data.toString().trim();
      if (text) {
        this.bufferLog("stderr", text);
      }
    });

    this.process.on("close", async (code) => {
      await this.flushLogs();
      if (this.flushTimer) clearInterval(this.flushTimer);

      if (this.killed) return;

      const usage = this.getUsage();

      if (code === 0) {
        await this.writeLog(
          "system",
          `Agent completed successfully (${this.inputTokens.toLocaleString()} in / ${this.outputTokens.toLocaleString()} out tokens)`
        );
        this.emit("complete", usage);
      } else {
        await this.writeLog("system", `Agent exited with code ${code}`);
        this.emit("error", new Error(`Process exited with code ${code}`), usage);
      }
    });

    this.process.on("error", async (err) => {
      await this.writeLog("system", `Agent error: ${err.message}`);
      this.emit("error", err, this.getUsage());
    });

    return this.process.pid;
  }

  private getUsage() {
    const costEstimate =
      (this.inputTokens / 1_000_000) * COST_PER_M_INPUT +
      (this.outputTokens / 1_000_000) * COST_PER_M_OUTPUT;
    return {
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      costEstimate: Math.round(costEstimate * 10000) / 10000, // 4 decimal places
    };
  }

  private bufferLog(stream: string, content: string) {
    this.logBuffer.push({ stream, content });
    emitEvent({ type: "task:log", taskId: this.taskId, content, stream });
  }

  private async flushLogs() {
    if (this.logBuffer.length === 0) return;
    const batch = this.logBuffer.splice(0);
    try {
      await prisma.taskLog.createMany({
        data: batch.map((log) => ({
          taskId: this.taskId,
          stream: log.stream,
          content: log.content,
        })),
      });
    } catch {
      // DB write failed, logs lost
    }
  }

  private async writeLog(stream: string, content: string) {
    try {
      await prisma.taskLog.create({
        data: { taskId: this.taskId, stream, content },
      });
      emitEvent({ type: "task:log", taskId: this.taskId, content, stream });
    } catch {
      // DB write failed
    }
  }

  async kill() {
    this.killed = true;
    if (!this.process || !this.process.pid) return;

    const pid = this.process.pid;
    await this.writeLog("system", `Killing agent (PID: ${pid})`);

    try {
      // Windows: use taskkill to kill the entire process tree
      if (process.platform === "win32") {
        execSync(`taskkill /pid ${pid} /T /F`, { stdio: "ignore" });
      } else {
        this.process.kill("SIGTERM");
        // Force kill after 5 seconds
        setTimeout(() => {
          try {
            this.process?.kill("SIGKILL");
          } catch {
            // already dead
          }
        }, 5000);
      }
    } catch {
      // process already dead
    }

    if (this.flushTimer) clearInterval(this.flushTimer);
    await this.flushLogs();
  }

  getPid(): number | undefined {
    return this.process?.pid;
  }
}
