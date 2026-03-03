import { EventEmitter } from "events";

const globalForEvents = globalThis as unknown as {
  eventBus: EventEmitter | undefined;
};

export const eventBus =
  globalForEvents.eventBus ?? new EventEmitter();

eventBus.setMaxListeners(50);

if (process.env.NODE_ENV !== "production") {
  globalForEvents.eventBus = eventBus;
}

// Event types
export type SSEEvent =
  | { type: "task:updated"; taskId: string }
  | { type: "task:log"; taskId: string; content: string; stream: string }
  | { type: "dispatcher:status"; running: boolean };

export function emitEvent(event: SSEEvent) {
  eventBus.emit("sse", event);
}
