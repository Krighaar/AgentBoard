"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDispatcherStatus } from "@/hooks/useTasksQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function DispatcherToggle() {
  const queryClient = useQueryClient();
  const { data: status } = useDispatcherStatus();

  const toggle = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/dispatcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: status?.running ? "stop" : "start",
        }),
      });
      if (!res.ok) throw new Error("Failed to toggle dispatcher");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatcher"] });
    },
  });

  return (
    <div className="flex items-center gap-2">
      {status && (
        <Badge
          variant="outline"
          className={
            status.running
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-muted text-muted-foreground"
          }
        >
          {status.running
            ? `Running (${status.activeTasks}/${status.maxConcurrent})`
            : "Stopped"}
        </Badge>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => toggle.mutate()}
        disabled={toggle.isPending}
      >
        {status?.running ? "Stop Dispatcher" : "Start Dispatcher"}
      </Button>
    </div>
  );
}
