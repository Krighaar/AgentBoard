import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { emitEvent } from "@/lib/event-emitter";
import { z } from "zod/v4";

const updateMemorySchema = z.object({
  value: z.string().min(1, "Value is required"),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const memory = await prisma.memory.findUnique({ where: { id } });
  if (!memory) {
    return NextResponse.json({ error: "Memory not found" }, { status: 404 });
  }
  return NextResponse.json(memory);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const data = updateMemorySchema.parse(body);

    const memory = await prisma.memory.update({
      where: { id },
      data: { value: data.value },
    });

    emitEvent({ type: "memory:updated", boardId: memory.boardId });
    return NextResponse.json(memory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update memory" },
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
    const memory = await prisma.memory.delete({ where: { id } });
    emitEvent({ type: "memory:updated", boardId: memory.boardId });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete memory" },
      { status: 500 }
    );
  }
}
