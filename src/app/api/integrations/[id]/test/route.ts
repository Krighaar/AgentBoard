import { NextResponse } from "next/server";
import { sendTestNotification } from "@/lib/integration-dispatcher";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await sendTestNotification(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Test notification failed" },
      { status: result.error === "Integration not found" ? 404 : 500 }
    );
  }

  return NextResponse.json({ success: true });
}
