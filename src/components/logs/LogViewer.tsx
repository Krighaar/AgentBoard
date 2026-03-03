"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LogEntry {
  id: string;
  stream: string;
  content: string;
  timestamp: string;
}

interface LogViewerProps {
  taskId: string;
  isActive: boolean;
}

export function LogViewer({ taskId, isActive }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastTimestampRef = useRef<string | null>(null);

  const fetchLogs = useCallback(async () => {
    const params = lastTimestampRef.current
      ? `?after=${encodeURIComponent(lastTimestampRef.current)}`
      : "";
    try {
      const res = await fetch(`/api/tasks/${taskId}/logs${params}`);
      if (!res.ok) return;
      const newLogs: LogEntry[] = await res.json();
      if (newLogs.length > 0) {
        lastTimestampRef.current = newLogs[newLogs.length - 1].timestamp;
        setLogs((prev) => [...prev, ...newLogs]);
      }
    } catch {
      // fetch failed
    }
  }, [taskId]);

  useEffect(() => {
    // Reset on taskId change
    setLogs([]);
    lastTimestampRef.current = null;
    fetchLogs();
  }, [taskId, fetchLogs]);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [isActive, fetchLogs]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-md border border-border bg-muted/30">
        <span className="text-sm text-muted-foreground/50">No logs yet</span>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 rounded-md border border-border bg-black/50">
      <div className="p-3 font-mono text-xs leading-relaxed">
        {logs.map((log) => (
          <div
            key={log.id}
            className={
              log.stream === "stderr"
                ? "text-red-400"
                : log.stream === "system"
                  ? "text-yellow-400"
                  : "text-green-300"
            }
          >
            <span className="mr-2 text-muted-foreground/40">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            {log.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
