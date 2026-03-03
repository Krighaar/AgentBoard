import { NextResponse } from "next/server";
import { getDispatcher } from "@/lib/dispatcher";

export async function GET() {
  const dispatcher = getDispatcher();
  return NextResponse.json(dispatcher.getStatus());
}

export async function POST(request: Request) {
  const body = await request.json();
  const dispatcher = getDispatcher();

  if (body.action === "start") {
    dispatcher.start();
    return NextResponse.json({ success: true, running: true });
  }

  if (body.action === "stop") {
    dispatcher.stop();
    return NextResponse.json({ success: true, running: false });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
