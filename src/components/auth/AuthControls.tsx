"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, Users } from "lucide-react";

export default function AuthControls() {
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/admin/users"
        className="flex h-8 items-center gap-1.5 border border-ocean-700/60 bg-ocean-900/95 px-3 text-[11px] font-semibold uppercase tracking-wider text-ocean-200 hover:border-signal-blue hover:text-white"
      >
        <Users size={13} />
        Manage Users
      </Link>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex h-8 items-center gap-1.5 border border-ocean-700/60 bg-ocean-900/95 px-3 text-[11px] font-semibold uppercase tracking-wider text-ocean-400 hover:border-signal-red hover:text-white"
      >
        <LogOut size={13} />
        Logout
      </button>
    </div>
  );
}
