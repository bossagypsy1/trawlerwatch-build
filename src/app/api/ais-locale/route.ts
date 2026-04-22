import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const upstreamUrl = process.env.AIS_INTERNAL_URL;
  if (!upstreamUrl) {
    return NextResponse.json({ error: "AIS_INTERNAL_URL is not configured" }, { status: 500 });
  }

  // Derive base URL by stripping the trailing path (e.g. /status)
  const base = upstreamUrl.replace(/\/[^/]+$/, "");

  try {
    const body = await req.json();
    const response = await fetch(`${base}/locale`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Failed to reach AIS backend" }, { status: 502 });
  }
}
