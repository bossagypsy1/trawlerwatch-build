import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Proxies to the aisstream backend /vessels endpoint, which reads current
// vessel state from Neon (5 s server-side cache) and returns it as AISUpdate[].
export async function GET() {
  const base = process.env.AIS_INTERNAL_URL;

  if (!base) {
    return NextResponse.json(
      { error: "AIS_INTERNAL_URL is not configured" },
      { status: 500 },
    );
  }

  // Derive /vessels from whatever AIS_INTERNAL_URL contains (may include /status path).
  const { protocol, host } = new URL(base);
  const url = `${protocol}//${host}/vessels`;

  try {
    const response = await fetch(url, { cache: "no-store" });
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
