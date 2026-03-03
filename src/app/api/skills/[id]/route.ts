import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod/v4";

const updateSkillSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  prompt: z.string().optional(),
  criteria: z.string().optional(),
  model: z.string().optional(),
  tags: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const skill = await prisma.skill.findUnique({ where: { id } });
  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }
  return NextResponse.json(skill);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const data = updateSkillSchema.parse(body);

    const skill = await prisma.skill.update({
      where: { id },
      data,
    });
    return NextResponse.json(skill);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update skill" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const skill = await prisma.skill.findUnique({ where: { id } });
  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }
  if (skill.isBuiltIn) {
    return NextResponse.json(
      { error: "Cannot delete built-in skills" },
      { status: 400 }
    );
  }

  try {
    await prisma.skill.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete skill" },
      { status: 500 }
    );
  }
}
