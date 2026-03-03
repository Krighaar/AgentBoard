import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod/v4";

const updateIntegrationSchema = z.object({
  name: z.string().min(1).optional(),
  config: z.string().optional(),
  enabled: z.boolean().optional(),
  events: z.string().optional(),
  boardId: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const integration = await prisma.integration.findUnique({ where: { id } });
  if (!integration) {
    return NextResponse.json(
      { error: "Integration not found" },
      { status: 404 }
    );
  }
  return NextResponse.json(integration);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const data = updateIntegrationSchema.parse(body);

    const integration = await prisma.integration.update({
      where: { id },
      data,
    });
    return NextResponse.json(integration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update integration" },
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
    await prisma.integration.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete integration" },
      { status: 500 }
    );
  }
}
