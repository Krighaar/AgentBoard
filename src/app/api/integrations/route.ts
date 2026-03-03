import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod/v4";

const createIntegrationSchema = z.object({
  type: z.enum(["webhook", "slack"]),
  name: z.string().min(1, "Name is required"),
  config: z.string().default("{}"),
  enabled: z.boolean().default(true),
  events: z.string().default("task:done,task:failed"),
  boardId: z.string().default(""),
});

export async function GET() {
  const integrations = await prisma.integration.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(integrations);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createIntegrationSchema.parse(body);

    const integration = await prisma.integration.create({ data });
    return NextResponse.json(integration, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create integration" },
      { status: 500 }
    );
  }
}
