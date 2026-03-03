"use client";

import { useMemo } from "react";
import { useTasksQuery } from "@/hooks/useTasksQuery";
import { formatDuration } from "@/lib/utils";

export function BoardStats() {
  const { data: tasks = [] } = useTasksQuery();

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const failed = tasks.filter((t) => t.status === "failed").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const queued = tasks.filter(
      (t) => t.status === "todo" || t.status === "ready"
    ).length;

    const completed = done + failed;
    const successRate = completed > 0 ? Math.round((done / completed) * 100) : null;

    // Average completion time for done tasks
    const completedTasks = tasks.filter(
      (t) => t.status === "done" && t.startedAt && t.completedAt
    );
    let avgDuration: string | null = null;
    if (completedTasks.length > 0) {
      const totalMs = completedTasks.reduce((sum, t) => {
        return sum + (new Date(t.completedAt!).getTime() - new Date(t.startedAt!).getTime());
      }, 0);
      avgDuration = formatDuration(
        new Date(0),
        new Date(totalMs / completedTasks.length)
      );
    }

    // Total cost
    const totalCost = tasks.reduce((sum, t) => sum + (t.costEstimate ?? 0), 0);
    const totalTokensIn = tasks.reduce((sum, t) => sum + (t.inputTokens ?? 0), 0);
    const totalTokensOut = tasks.reduce((sum, t) => sum + (t.outputTokens ?? 0), 0);

    return {
      total,
      done,
      failed,
      inProgress,
      queued,
      successRate,
      avgDuration,
      totalCost,
      totalTokensIn,
      totalTokensOut,
    };
  }, [tasks]);

  if (stats.total === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-border px-6 py-2 text-xs text-muted-foreground">
      <Stat label="Total" value={stats.total} />
      <Stat label="Queue" value={stats.queued} />
      <Stat label="Running" value={stats.inProgress} />
      <Stat label="Done" value={stats.done} className="text-green-400" />
      <Stat label="Failed" value={stats.failed} className="text-red-400" />
      {stats.successRate !== null && (
        <Stat
          label="Success Rate"
          value={`${stats.successRate}%`}
          className={stats.successRate >= 80 ? "text-green-400" : stats.successRate >= 50 ? "text-yellow-400" : "text-red-400"}
        />
      )}
      {stats.avgDuration && (
        <Stat label="Avg Duration" value={stats.avgDuration} />
      )}
      {stats.totalCost > 0 && (
        <Stat label="Total Cost" value={`$${stats.totalCost.toFixed(4)}`} />
      )}
      {(stats.totalTokensIn > 0 || stats.totalTokensOut > 0) && (
        <Stat
          label="Tokens"
          value={`${(stats.totalTokensIn + stats.totalTokensOut).toLocaleString()}`}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <span>
      {label}:{" "}
      <span className={`font-medium text-foreground ${className}`}>
        {value}
      </span>
    </span>
  );
}
