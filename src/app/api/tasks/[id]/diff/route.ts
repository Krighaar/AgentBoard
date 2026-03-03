import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { execSync } from "child_process";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (!task.repoUrl) {
    return NextResponse.json(
      { diff: "", error: "No working directory set for this task" },
      { status: 200 }
    );
  }

  try {
    const diff = execSync("git diff HEAD", {
      cwd: task.repoUrl,
      encoding: "utf-8",
      maxBuffer: 1024 * 1024 * 5, // 5MB
      timeout: 10000,
    });

    // If no uncommitted changes, try showing the last commit's diff
    if (!diff.trim()) {
      const lastCommitDiff = execSync("git diff HEAD~1..HEAD", {
        cwd: task.repoUrl,
        encoding: "utf-8",
        maxBuffer: 1024 * 1024 * 5,
        timeout: 10000,
      }).trim();

      return NextResponse.json({
        diff: lastCommitDiff || "(no changes detected)",
      });
    }

    return NextResponse.json({ diff });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to run git diff";
    return NextResponse.json({ diff: "", error: message }, { status: 200 });
  }
}
