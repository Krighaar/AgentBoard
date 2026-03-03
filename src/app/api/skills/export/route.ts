import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDefaults } from "@/lib/ensure-defaults";

export async function GET() {
  await ensureDefaults();
  const skills = await prisma.skill.findMany({
    orderBy: [{ isBuiltIn: "desc" }, { name: "asc" }],
  });

  const exportData = skills.map((skill) => ({
    name: skill.name,
    description: skill.description,
    prompt: skill.prompt,
    criteria: skill.criteria,
    model: skill.model,
    tags: skill.tags,
    isBuiltIn: skill.isBuiltIn,
  }));

  const json = JSON.stringify(exportData, null, 2);
  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="agentboard-skills-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
