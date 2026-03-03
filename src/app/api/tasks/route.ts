import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { emitEvent } from "@/lib/event-emitter";
import { z } from "zod/v4";

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  criteria: z.string().optional().default(""),
  repoUrl: z.string().optional().default(""),
  priority: z.number().int().min(1).max(3).optional().default(2),
});

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: [{ priority: "asc" }, { position: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createTaskSchema.parse(body);

    const maxPos = await prisma.task.aggregate({
      _max: { position: true },
      where: { status: "todo" },
    });

    const task = await prisma.task.create({
      data: {
        ...data,
        position: (maxPos._max.position ?? 0) + 1,
      },
    });

    emitEvent({ type: "task:updated", taskId: task.id });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");

  if (scope !== "done") {
    return NextResponse.json(
      { error: "Invalid scope. Use scope=done" },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.task.deleteMany({
      where: {
        status: {
          in: ["done", "failed"],
        },
      },
    });

    emitEvent({ type: "task:updated", taskId: "bulk-clear-done" });
    return NextResponse.json({ success: true, deletedCount: result.count });
  } catch {
    return NextResponse.json(
      { error: "Failed to clear done tasks" },
      { status: 500 }
    );
  }
}
