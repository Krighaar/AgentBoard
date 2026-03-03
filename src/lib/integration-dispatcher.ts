import crypto from "crypto";
import { prisma } from "@/lib/db";

interface TaskPayload {
  id: string;
  title: string;
  status: string;
  boardId: string;
  [key: string]: unknown;
}

interface WebhookConfig {
  url: string;
  secret?: string;
  headers?: Record<string, string>;
}

interface SlackConfig {
  webhookUrl: string;
  channel?: string;
}

/**
 * Fire all enabled integrations matching the given event.
 * This is fire-and-forget: errors are logged but never thrown.
 */
export async function fireIntegrations(
  event: string,
  taskData: TaskPayload
): Promise<void> {
  try {
    const integrations = await prisma.integration.findMany({
      where: { enabled: true },
    });

    const matching = integrations.filter((i) => {
      const events = i.events.split(",").map((e) => e.trim());
      if (!events.includes(event)) return false;
      // Scope to board if set
      if (i.boardId && i.boardId !== taskData.boardId) return false;
      return true;
    });

    const promises = matching.map((integration) => {
      if (integration.type === "webhook") {
        return sendWebhook(integration.config, event, taskData);
      } else if (integration.type === "slack") {
        return sendSlack(integration.config, event, taskData);
      }
      return Promise.resolve();
    });

    await Promise.allSettled(promises);
  } catch (err) {
    console.error("[integration-dispatcher] Failed to fire integrations:", err);
  }
}

/**
 * Send a test notification for a specific integration.
 */
export async function sendTestNotification(
  integrationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      return { success: false, error: "Integration not found" };
    }

    const testPayload: TaskPayload = {
      id: "test-task-id",
      title: "Test Task",
      status: "done",
      boardId: integration.boardId || "default",
      description: "This is a test notification from AgentBoard.",
    };

    if (integration.type === "webhook") {
      await sendWebhook(integration.config, "test", testPayload);
    } else if (integration.type === "slack") {
      await sendSlack(integration.config, "test", testPayload);
    }

    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error";
    console.error("[integration-dispatcher] Test notification failed:", err);
    return { success: false, error: message };
  }
}

async function sendWebhook(
  configJson: string,
  event: string,
  taskData: TaskPayload
): Promise<void> {
  const config: WebhookConfig = JSON.parse(configJson);
  if (!config.url) return;

  const body = JSON.stringify({ event, task: taskData, timestamp: new Date().toISOString() });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(config.headers || {}),
  };

  if (config.secret) {
    const signature = crypto
      .createHmac("sha256", config.secret)
      .update(body)
      .digest("hex");
    headers["X-Signature-256"] = signature;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(config.url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(
        `[integration-dispatcher] Webhook returned ${res.status}: ${await res.text().catch(() => "")}`
      );
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function sendSlack(
  configJson: string,
  event: string,
  taskData: TaskPayload
): Promise<void> {
  const config: SlackConfig = JSON.parse(configJson);
  if (!config.webhookUrl) return;

  const statusEmoji: Record<string, string> = {
    "task:done": ":white_check_mark:",
    "task:failed": ":x:",
    "task:review": ":eyes:",
    test: ":test_tube:",
  };

  const emoji = statusEmoji[event] || ":bell:";

  const body = JSON.stringify({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${emoji} *${event}*: ${taskData.title}\nStatus: \`${taskData.status}\`\nBoard: \`${taskData.boardId}\``,
        },
      },
    ],
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(
        `[integration-dispatcher] Slack returned ${res.status}: ${await res.text().catch(() => "")}`
      );
    }
  } finally {
    clearTimeout(timeout);
  }
}
