import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDispatcher } from "@/lib/dispatcher";
import { emitEvent } from "@/lib/event-emitter";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (task.status !== "in_progress") {
    return NextResponse.json(
      { error: "Task is not in progress" },
      { status: 400 }
    );
  }

  const dispatcher = getDispatcher();
  dispatcher.stopTask(id);

  const updated = await prisma.task.update({
    where: { id },
    data: {
      status: "failed",
      error: "Manually stopped",
      agentPid: null,
    },
  });

  emitEvent({ type: "task:updated", taskId: id });
  return NextResponse.json(updated);
}
