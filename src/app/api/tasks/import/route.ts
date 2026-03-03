import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDefaults } from "@/lib/ensure-defaults";
import { emitEvent } from "@/lib/event-emitter";
import { z } from "zod/v4";

const importTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  criteria: z.string().optional().default(""),
  repoUrl: z.string().optional().default(""),
  status: z.string().optional().default("todo"),
  priority: z.number().int().min(1).max(3).optional().default(2),
  tags: z.string().optional().default(""),
  dependsOn: z.string().optional().default(""),
  model: z.string().optional().default(""),
});

const importPayloadSchema = z.array(importTaskSchema);

export async function POST(request: Request) {
  try {
    await ensureDefaults();
    const body = await request.json();
    const tasks = importPayloadSchema.parse(body);

    const maxPos = await prisma.task.aggregate({
      _max: { position: true },
      where: { status: "todo" },
    });
    let position = (maxPos._max.position ?? 0) + 1;

    const created = [];
    for (const taskData of tasks) {
      const task = await prisma.task.create({
        data: {
          ...taskData,
          boardId: "default",
          position: position++,
        },
      });
      created.push(task);
    }

    emitEvent({ type: "task:updated", taskId: "bulk-import" });
    return NextResponse.json(
      { success: true, imported: created.length },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to import tasks" },
      { status: 500 }
    );
  }
}
