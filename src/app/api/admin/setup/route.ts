import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ensureUsersTable, query } from "@/lib/db";

export const dynamic = "force-dynamic";

const initialEmail = "admin@local";
const initialPassword = "Admin@2024!";

export async function GET() {
  await ensureUsersTable();

  const count = await query<{ count: string }>("SELECT COUNT(*)::text AS count FROM users");
  const created = count.rows[0]?.count === "0";

  if (created) {
    const passwordHash = await bcrypt.hash(initialPassword, 12);
    await query(
      "INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3)",
      [initialEmail, "Local Admin", passwordHash],
    );
  }

  return NextResponse.json({
    ok: true,
    createdInitialUser: created,
    email: initialEmail,
    password: created ? initialPassword : "unchanged",
  });
}
