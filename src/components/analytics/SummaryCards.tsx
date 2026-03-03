"use client";

interface SummaryCardsProps {
  summary: {
    totalCost: number;
    totalTasks: number;
    avgCost: number;
    totalInputTokens: number;
    totalOutputTokens: number;
  };
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

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    { label: "Total Cost", value: formatCost(summary.totalCost) },
    { label: "Total Tasks", value: summary.totalTasks.toString() },
    { label: "Avg Cost/Task", value: formatCost(summary.avgCost) },
    {
      label: "Total Tokens",
      value: formatTokens(summary.totalInputTokens + summary.totalOutputTokens),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-border bg-card p-3"
        >
          <div className="text-xs text-muted-foreground">{card.label}</div>
          <div className="mt-1 text-lg font-semibold">{card.value}</div>
        </div>
      ))}
    </div>
  );
}
