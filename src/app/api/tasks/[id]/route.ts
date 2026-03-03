import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { emitEvent } from "@/lib/event-emitter";
import { z } from "zod/v4";

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  criteria: z.string().optional(),
  repoUrl: z.string().optional(),
  status: z.enum(["todo", "ready", "in_progress", "done", "failed"]).optional(),
  priority: z.number().int().min(1).max(3).optional(),
  position: z.number().int().optional(),
  error: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  inputTokens: z.number().int().optional(),
  outputTokens: z.number().int().optional(),
  costEstimate: z.number().optional(),
  tags: z.string().optional(),
  dependsOn: z.string().optional(),
  model: z.string().optional(),
  boardId: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json(task);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const data = updateTaskSchema.parse(body);

    const task = await prisma.task.update({
      where: { id },
      data,
    });

    emitEvent({ type: "task:updated", taskId: task.id });
    return NextResponse.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.task.delete({ where: { id } });
    emitEvent({ type: "task:updated", taskId: id });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
