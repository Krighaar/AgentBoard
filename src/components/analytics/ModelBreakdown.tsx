"use client";

interface ModelData {
  model: string;
  cost: number;
  tokens: number;
  count: number;
}

interface ModelBreakdownProps {
  data: ModelData[];
}

function formatCost(cost: number): string {
  if (cost === 0) return "$0.00";
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

const MODEL_COLORS = [
  "bg-primary",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-purple-500",
];

export function ModelBreakdown({ data }: ModelBreakdownProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-border bg-card text-sm text-muted-foreground">
        No model data
      </div>
    );
  }

  const totalCost = data.reduce((sum, d) => sum + d.cost, 0);

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-3 text-sm font-medium">Model Breakdown</div>

      {/* Stacked bar */}
      <div className="mb-3 flex h-4 overflow-hidden rounded-full bg-muted">
        {data.map((d, i) => {
          const pct = totalCost > 0 ? (d.cost / totalCost) * 100 : 0;
          if (pct < 0.5) return null;
          return (
            <div
              key={d.model}
              className={`${MODEL_COLORS[i % MODEL_COLORS.length]} transition-all`}
              style={{ width: `${pct}%` }}
              title={`${d.model}: ${formatCost(d.cost)} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {data.map((d, i) => {
          const pct = totalCost > 0 ? (d.cost / totalCost) * 100 : 0;
          return (
            <div key={d.model} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${MODEL_COLORS[i % MODEL_COLORS.length]}`}
                />
                <span className="font-medium">{d.model}</span>
                <span className="text-muted-foreground">
                  {d.count} task{d.count !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
                <span className="font-medium">{formatCost(d.cost)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
