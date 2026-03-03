"use client";

interface DailyCost {
  date: string;
  cost: number;
  tokens: number;
}

interface CostChartProps {
  data: DailyCost[];
}

function formatCost(cost: number): string {
  if (cost === 0) return "$0";
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

export function CostChart({ data }: CostChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-border bg-card text-sm text-muted-foreground">
        No cost data for this period
      </div>
    );
  }

  const maxCost = Math.max(...data.map((d) => d.cost), 0.001);
  const chartHeight = 160;
  const chartWidth = 600;
  const barPadding = 2;
  const barWidth = Math.max(8, Math.min(40, (chartWidth - 60) / data.length - barPadding));
  const totalBarsWidth = data.length * (barWidth + barPadding);
  const startX = 50;
  const svgWidth = Math.max(chartWidth, startX + totalBarsWidth + 20);

  // Y-axis ticks
  const yTicks = 4;
  const yStep = maxCost / yTicks;

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 text-sm font-medium">Daily Costs</div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${chartHeight + 40}`}
          className="w-full"
          style={{ minWidth: `${Math.min(svgWidth, 400)}px` }}
        >
          {/* Y-axis labels and grid lines */}
          {Array.from({ length: yTicks + 1 }).map((_, i) => {
            const value = yStep * (yTicks - i);
            const y = 10 + (i / yTicks) * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={startX}
                  y1={y}
                  x2={svgWidth - 10}
                  y2={y}
                  className="stroke-border"
                  strokeWidth={0.5}
                />
                <text
                  x={startX - 5}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-muted-foreground"
                  fontSize={9}
                >
                  {formatCost(value)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((d, i) => {
            const barHeight = (d.cost / maxCost) * chartHeight;
            const x = startX + i * (barWidth + barPadding);
            const y = 10 + chartHeight - barHeight;

            return (
              <g key={d.date}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 1)}
                  rx={2}
                  className="fill-primary opacity-80 hover:opacity-100"
                />
                {/* X-axis label - show every Nth label to avoid overlap */}
                {(data.length <= 10 || i % Math.ceil(data.length / 10) === 0) && (
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 25}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    fontSize={8}
                  >
                    {d.date.slice(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
