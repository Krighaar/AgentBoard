"use client";

interface TopTask {
  id: string;
  title: string;
  cost: number;
  model: string;
  tokens: number;
}

interface TopTasksProps {
  data: TopTask[];
}

function formatCost(cost: number): string {
  if (cost === 0) return "$0.00";
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return tokens.toString();
}

export function TopTasks({ data }: TopTasksProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-border bg-card text-sm text-muted-foreground">
        No tasks to display
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 text-sm font-medium">Top Tasks by Cost</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 pr-3 font-medium">Title</th>
              <th className="pb-2 pr-3 font-medium">Model</th>
              <th className="pb-2 pr-3 text-right font-medium">Tokens</th>
              <th className="pb-2 text-right font-medium">Cost</th>
            </tr>
          </thead>
          <tbody>
            {data.map((task) => (
              <tr key={task.id} className="border-b border-border/50 last:border-0">
                <td className="max-w-[200px] truncate py-1.5 pr-3" title={task.title}>
                  {task.title}
                </td>
                <td className="py-1.5 pr-3 text-muted-foreground">{task.model}</td>
                <td className="py-1.5 pr-3 text-right text-muted-foreground">
                  {formatTokens(task.tokens)}
                </td>
                <td className="py-1.5 text-right font-medium">{formatCost(task.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
