import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { emitEvent } from "@/lib/event-emitter";
import { z } from "zod/v4";

const upsertMemorySchema = z.object({
  boardId: z.string().min(1),
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
  source: z.enum(["manual", "agent"]).optional().default("manual"),
  sourceTaskId: z.string().optional().default(""),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const boardId = searchParams.get("boardId") || "default";

  const memories = await prisma.memory.findMany({
    where: { boardId },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(memories);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = upsertMemorySchema.parse(body);

    const memory = await prisma.memory.upsert({
      where: {
        boardId_key: { boardId: data.boardId, key: data.key },
      },
      update: {
        value: data.value,
        source: data.source,
        sourceTaskId: data.sourceTaskId,
      },
      create: data,
    });

    emitEvent({ type: "memory:updated", boardId: data.boardId });
    return NextResponse.json(memory, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to upsert memory" },
      { status: 500 }
    );
  }
}
