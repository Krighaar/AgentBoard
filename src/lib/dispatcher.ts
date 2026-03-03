import { prisma } from "./db";
import { AgentProcess } from "./agent-process";
import { emitEvent } from "./event-emitter";

const MAX_CONCURRENT = 2;
const POLL_INTERVAL = 5000;

class AgentDispatcher {
  private running = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private activeProcesses = new Map<string, AgentProcess>();

  async start() {
    if (this.running) return;
    this.running = true;

    // Check for orphaned in_progress tasks on startup
    await this.cleanOrphans();

    // Start polling
    this.pollTimer = setInterval(() => this.poll(), POLL_INTERVAL);
    this.poll(); // immediate first poll

    emitEvent({ type: "dispatcher:status", running: true });
  }

  stop() {
    this.running = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    emitEvent({ type: "dispatcher:status", running: false });
  }

  getStatus() {
    return {
      running: this.running,
      activeTasks: this.activeProcesses.size,
      maxConcurrent: MAX_CONCURRENT,
    };
  }

  stopTask(taskId: string) {
    const proc = this.activeProcesses.get(taskId);
    if (proc) {
      proc.kill();
      this.activeProcesses.delete(taskId);
    }
  }

  private async cleanOrphans() {
    const orphans = await prisma.task.findMany({
      where: { status: "in_progress" },
    });

    for (const task of orphans) {
      if (!this.activeProcesses.has(task.id)) {
        // Check if PID is still alive
        if (task.agentPid) {
          try {
            process.kill(task.agentPid, 0); // signal 0 = check if alive
            continue; // still running, skip
          } catch {
            // process is dead, mark as failed
          }
        }

        await prisma.task.update({
          where: { id: task.id },
          data: {
            status: "failed",
            error: "Orphaned process (server restarted)",
            agentPid: null,
          },
        });
        emitEvent({ type: "task:updated", taskId: task.id });
      }
    }
  }

  private async poll() {
    if (!this.running) return;
    if (this.activeProcesses.size >= MAX_CONCURRENT) return;

    const slotsAvailable = MAX_CONCURRENT - this.activeProcesses.size;
    const tasks = await prisma.task.findMany({
      where: { status: "todo" },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      take: slotsAvailable,
    });

    for (const task of tasks) {
      if (this.activeProcesses.size >= MAX_CONCURRENT) break;
      await this.executeTask(task.id);
    }
  }

  private async executeTask(taskId: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return;

    // Build prompt from task details
    let prompt = task.title;
    if (task.description) {
      prompt += `\n\nDescription:\n${task.description}`;
    }
    if (task.criteria) {
      prompt += `\n\nAcceptance Criteria:\n${task.criteria}`;
    }

    const agentProcess = new AgentProcess(taskId);
    this.activeProcesses.set(taskId, agentProcess);

    try {
      const pid = await agentProcess.start(
        prompt,
        task.repoUrl || undefined
      );

      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: "in_progress",
          agentPid: pid ?? null,
          startedAt: new Date(),
        },
      });
      emitEvent({ type: "task:updated", taskId });

      agentProcess.on("complete", async () => {
        this.activeProcesses.delete(taskId);
        await prisma.task.update({
          where: { id: taskId },
          data: {
            status: "done",
            agentPid: null,
            completedAt: new Date(),
          },
        });
        emitEvent({ type: "task:updated", taskId });
      });

      agentProcess.on("error", async (error: Error) => {
        this.activeProcesses.delete(taskId);

        const currentTask = await prisma.task.findUnique({
          where: { id: taskId },
        });

        if (
          currentTask &&
          currentTask.retryCount < currentTask.maxRetries
        ) {
          // Auto-retry
          await prisma.task.update({
            where: { id: taskId },
            data: {
              status: "todo",
              agentPid: null,
              error: error.message,
              retryCount: { increment: 1 },
            },
          });
        } else {
          await prisma.task.update({
            where: { id: taskId },
            data: {
              status: "failed",
              agentPid: null,
              error: error.message,
            },
          });
        }
        emitEvent({ type: "task:updated", taskId });
      });
    } catch (error) {
      this.activeProcesses.delete(taskId);
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Failed to start agent",
          agentPid: null,
        },
      });
      emitEvent({ type: "task:updated", taskId });
    }
  }
}

// Singleton via globalThis (survives HMR)
const globalForDispatcher = globalThis as unknown as {
  dispatcher: AgentDispatcher | undefined;
};

export function getDispatcher(): AgentDispatcher {
  if (!globalForDispatcher.dispatcher) {
    globalForDispatcher.dispatcher = new AgentDispatcher();
  }
  return globalForDispatcher.dispatcher;
}
