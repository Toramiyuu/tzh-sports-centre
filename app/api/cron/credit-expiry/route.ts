import { NextRequest, NextResponse } from "next/server";
import { checkExpiringCredits } from "@/lib/absence";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await checkExpiringCredits();

    return NextResponse.json({
      success: true,
      notificationsCreated: count,
    });
  } catch (error) {
    console.error("Credit expiry cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
