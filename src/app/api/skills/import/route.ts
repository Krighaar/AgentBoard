import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod/v4";

const skillImportSchema = z.array(
  z.object({
    name: z.string().min(1),
    description: z.string().optional().default(""),
    prompt: z.string().optional().default(""),
    criteria: z.string().optional().default(""),
    model: z.string().optional().default(""),
    tags: z.string().optional().default(""),
    isBuiltIn: z.boolean().optional().default(false),
  })
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const skills = skillImportSchema.parse(body);

    let imported = 0;
    for (const skill of skills) {
      const existing = await prisma.skill.findFirst({
        where: { name: skill.name },
      });
      if (existing) {
        await prisma.skill.update({
          where: { id: existing.id },
          data: {
            description: skill.description,
            prompt: skill.prompt,
            criteria: skill.criteria,
            model: skill.model,
            tags: skill.tags,
          },
        });
      } else {
        await prisma.skill.create({ data: skill });
      }
      imported++;
    }

    return NextResponse.json({ imported });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid import format", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to import skills" },
      { status: 500 }
    );
  }
}
