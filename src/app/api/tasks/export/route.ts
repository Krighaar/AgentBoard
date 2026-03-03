import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDefaults } from "@/lib/ensure-defaults";

export async function GET(request: Request) {
  await ensureDefaults();
  const { searchParams } = new URL(request.url);
  const boardId = searchParams.get("boardId") || "default";

  const tasks = await prisma.task.findMany({
    where: { boardId },
    orderBy: { createdAt: "asc" },
  });

  // Strip internal fields not useful for import/export
  const exportData = tasks.map((task) => ({
    title: task.title,
    description: task.description,
    criteria: task.criteria,
    repoUrl: task.repoUrl,
    status: task.status,
    priority: task.priority,
    tags: task.tags,
    dependsOn: task.dependsOn,
    model: task.model,
  }));

  const json = JSON.stringify(exportData, null, 2);
  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="agentboard-tasks-${boardId}-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
