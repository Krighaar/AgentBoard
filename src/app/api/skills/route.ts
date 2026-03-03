import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDefaults } from "@/lib/ensure-defaults";
import { z } from "zod/v4";

const createSkillSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  prompt: z.string().optional().default(""),
  criteria: z.string().optional().default(""),
  model: z.string().optional().default(""),
  tags: z.string().optional().default(""),
});

export async function GET() {
  await ensureDefaults();
  const skills = await prisma.skill.findMany({
    orderBy: [{ isBuiltIn: "desc" }, { name: "asc" }],
  });
  return NextResponse.json(skills);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createSkillSchema.parse(body);

    const skill = await prisma.skill.create({ data });
    return NextResponse.json(skill, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create skill" },
      { status: 500 }
    );
  }
}
