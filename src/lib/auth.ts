import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { ensureUsersTable, query, UserRow } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Basic Baked Users Auth",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        await ensureUsersTable();
        const result = await query<UserRow>(
          "SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1",
          [email],
        );
        const user = result.rows[0];
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: user.name ?? user.email,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  // TODO before commercial/production use:
  // Set NEXTAUTH_SECRET in Vercel and stop relying on this baked fallback secret.
  secret: process.env.NEXTAUTH_SECRET ?? "trawlerwatch-baked-auth-secret-change-before-production",
};
