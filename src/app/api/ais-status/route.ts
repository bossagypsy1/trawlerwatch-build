import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const upstreamUrl = process.env.AIS_INTERNAL_URL;

  if (!upstreamUrl) {
    return NextResponse.json(
      { error: "AIS_INTERNAL_URL is not configured" },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(upstreamUrl, { cache: "no-store" });
    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach AIS backend" },
      { status: 502 },
    );
  }
}
