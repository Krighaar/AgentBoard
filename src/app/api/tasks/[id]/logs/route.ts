import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const after = url.searchParams.get("after");

  const logs = await prisma.taskLog.findMany({
    where: {
      taskId: id,
      ...(after ? { timestamp: { gt: new Date(after) } } : {}),
    },
    orderBy: { timestamp: "asc" },
    take: 500,
  });

  return NextResponse.json(logs);
}
