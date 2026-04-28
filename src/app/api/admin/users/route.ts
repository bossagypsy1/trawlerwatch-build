import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { ensureUsersTable, query } from "@/lib/db";

export const dynamic = "force-dynamic";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  await ensureUsersTable();
  const result = await query<{
    id: number;
    email: string;
    name: string | null;
    created_at: string;
  }>(`
    SELECT id, email, name, created_at::text AS created_at
    FROM users
    ORDER BY id ASC
  `);

  return NextResponse.json({ users: result.rows });
}

export async function POST(req: Request) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim() || null;
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  await ensureUsersTable();
  const passwordHash = await bcrypt.hash(password, 12);
  await query(
    "INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3)",
    [email, name, passwordHash],
  );

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const id = Number(body.id);
  const email = String(body.email ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim() || null;
  const password = String(body.password ?? "");

  if (!id || !email) {
    return NextResponse.json({ error: "User id and email are required" }, { status: 400 });
  }

  await ensureUsersTable();

  if (password) {
    const passwordHash = await bcrypt.hash(password, 12);
    await query(
      "UPDATE users SET email = $1, name = $2, password_hash = $3 WHERE id = $4",
      [email, name, passwordHash, id],
    );
  } else {
    await query(
      "UPDATE users SET email = $1, name = $2 WHERE id = $3",
      [email, name, id],
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) {
    return NextResponse.json({ error: "User id is required" }, { status: 400 });
  }

  await ensureUsersTable();
  await query("DELETE FROM users WHERE id = $1", [id]);

  return NextResponse.json({ ok: true });
}
