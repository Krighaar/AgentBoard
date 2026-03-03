"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDispatcherStatus, useSettings, useUpdateSetting } from "@/hooks/useTasksQuery";

export function DispatcherToggle() {
  const { data: status } = useDispatcherStatus();
  const { data: settings } = useSettings();
  const updateSetting = useUpdateSetting();

  const handleToggle = async () => {
    const res = await fetch("/api/dispatcher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: status?.running ? "stop" : "start",
      }),
    });
    if (!res.ok) throw new Error("Failed to toggle dispatcher");
  };

  const handleConcurrencyChange = (value: string) => {
    updateSetting.mutate({ key: "maxConcurrent", value });
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={String(settings?.maxConcurrent ?? 2)}
        onValueChange={handleConcurrencyChange}
      >
        <SelectTrigger className="h-8 w-[110px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n} agent{n > 1 ? "s" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
        onClick={handleToggle}
      >
        {status?.running ? "Stop Dispatcher" : "Start Dispatcher"}
      </Button>
    </div>
  );
}
