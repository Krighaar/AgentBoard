"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAnalyticsQuery } from "@/hooks/useTasksQuery";
import { SummaryCards } from "./SummaryCards";
import { CostChart } from "./CostChart";
import { ModelBreakdown } from "./ModelBreakdown";
import { TopTasks } from "./TopTasks";

interface AnalyticsPanelProps {
  boardId: string;
}

const PERIODS = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "all", label: "All" },
] as const;

export function AnalyticsPanel({ boardId }: AnalyticsPanelProps) {
  const [period, setPeriod] = useState("7d");
  const { data, isLoading } = useAnalyticsQuery(boardId, period);

  return (
    <div className="border-b border-border bg-muted/30 px-6 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium">Cost Analytics</div>
        <div className="flex items-center gap-1">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "default" : "outline"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          Loading analytics...
        </div>
      ) : data ? (
        <div className="space-y-3">
          <SummaryCards summary={data.summary} />
          <div className="grid gap-3 lg:grid-cols-2">
            <CostChart data={data.dailyCosts} />
            <ModelBreakdown data={data.modelBreakdown} />
          </div>
          <TopTasks data={data.topTasks} />
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          No analytics data available
        </div>
      )}
    </div>
  );
}
