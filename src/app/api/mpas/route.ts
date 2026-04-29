import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const upstreamUrl = process.env.AIS_INTERNAL_URL;

  if (!upstreamUrl) {
    return NextResponse.json(
      { error: "AIS_INTERNAL_URL is not configured" },
      { status: 500 },
    );
  }

  const base = upstreamUrl.replace(/\/[^/]+$/, "");
  const url = new URL(req.url);
  const localeId = url.searchParams.get("localeId");

  const tryProxy = async (targetBase: string) => {
    const target = new URL(`${targetBase}/mpas`);
    if (localeId) target.searchParams.set("localeId", localeId);

    const response = await fetch(target, { cache: "no-store" });
    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
      },
    });
  };

  try {
    const upstreamResponse = await tryProxy(base);
    if (upstreamResponse.status !== 404) {
      return upstreamResponse;
    }

    return await tryProxy("http://localhost:5000");
  } catch {
    return NextResponse.json(
      { error: "Failed to reach AIS backend" },
      { status: 502 },
    );
  }
}
