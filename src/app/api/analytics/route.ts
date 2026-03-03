import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDefaults } from "@/lib/ensure-defaults";

function getPeriodDate(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "all":
      return null;
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  await ensureDefaults();
  const { searchParams } = new URL(request.url);
  const boardId = searchParams.get("boardId") || "default";
  const period = searchParams.get("period") || "7d";

  const periodStart = getPeriodDate(period);

  const where: Record<string, unknown> = {
    boardId,
    status: { in: ["done", "failed"] },
  };
  if (periodStart) {
    where.completedAt = { gte: periodStart };
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { completedAt: "asc" },
  });

  // Daily costs
  const dailyMap = new Map<string, { cost: number; tokens: number }>();
  for (const task of tasks) {
    const date = task.completedAt ? formatDate(task.completedAt) : formatDate(task.createdAt);
    const existing = dailyMap.get(date) || { cost: 0, tokens: 0 };
    existing.cost += task.costEstimate;
    existing.tokens += task.inputTokens + task.outputTokens;
    dailyMap.set(date, existing);
  }
  const dailyCosts = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, cost: data.cost, tokens: data.tokens }));

  // Model breakdown
  const modelMap = new Map<string, { cost: number; tokens: number; count: number }>();
  for (const task of tasks) {
    const model = task.model || "default";
    const existing = modelMap.get(model) || { cost: 0, tokens: 0, count: 0 };
    existing.cost += task.costEstimate;
    existing.tokens += task.inputTokens + task.outputTokens;
    existing.count += 1;
    modelMap.set(model, existing);
  }
  const modelBreakdown = Array.from(modelMap.entries())
    .sort(([, a], [, b]) => b.cost - a.cost)
    .map(([model, data]) => ({ model, ...data }));

  // Summary
  const totalCost = tasks.reduce((sum, t) => sum + t.costEstimate, 0);
  const totalInputTokens = tasks.reduce((sum, t) => sum + t.inputTokens, 0);
  const totalOutputTokens = tasks.reduce((sum, t) => sum + t.outputTokens, 0);
  const totalTasks = tasks.length;
  const avgCost = totalTasks > 0 ? totalCost / totalTasks : 0;

  const summary = {
    totalCost,
    totalTasks,
    avgCost,
    totalInputTokens,
    totalOutputTokens,
  };

  // Top tasks by cost
  const topTasks = [...tasks]
    .sort((a, b) => b.costEstimate - a.costEstimate)
    .slice(0, 10)
    .map((t) => ({
      id: t.id,
      title: t.title,
      cost: t.costEstimate,
      model: t.model || "default",
      tokens: t.inputTokens + t.outputTokens,
    }));

  return NextResponse.json({ dailyCosts, modelBreakdown, summary, topTasks });
}
