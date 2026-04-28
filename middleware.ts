import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET ?? "trawlerwatch-baked-auth-secret-change-before-production";

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret });
  if (token) return NextResponse.next();

  const loginUrl = new URL("/login", req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!login|api/auth|api/admin/setup|_next|favicon.ico).*)",
  ],
};
