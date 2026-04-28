"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ArrowLeft, LogOut, Plus, Save, Trash2 } from "lucide-react";

interface User {
  id: number;
  email: string;
  name: string | null;
  created_at: string;
  password?: string;
}

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const data = await response.json();
    setUsers(data.users ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const addUser = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password }),
    });
    if (!response.ok) {
      const data = await response.json();
      setMessage(data.error ?? "Could not add user");
      return;
    }
    setEmail("");
    setName("");
    setPassword("");
    await load();
  };

  const saveUser = async (user: User) => {
    setMessage("");
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      const data = await response.json();
      setMessage(data.error ?? "Could not save user");
      return;
    }
    await load();
  };

  const deleteUser = async (id: number) => {
    setMessage("");
    const response = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      setMessage(data.error ?? "Could not delete user");
      return;
    }
    await load();
  };

  const updateUser = (id: number, patch: Partial<User>) => {
    setUsers((current) => current.map((user) => user.id === id ? { ...user, ...patch } : user));
  };

  return (
    <main className="min-h-full overflow-y-auto bg-ocean-950 px-4 py-6 text-ocean-200">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center gap-2">
          <Link href="/" className="flex h-8 items-center gap-1.5 border border-ocean-700 bg-ocean-900 px-3 text-xs text-ocean-300 hover:text-white">
            <ArrowLeft size={14} />
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="ml-auto flex h-8 items-center gap-1.5 border border-ocean-700 bg-ocean-900 px-3 text-xs text-ocean-300 hover:text-white"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>

        <h1 className="mb-1 font-display text-2xl font-semibold text-white">User Admin</h1>
        <p className="mb-5 text-sm text-ocean-400">Basic Baked Users Auth</p>

        <form onSubmit={addUser} className="mb-5 grid gap-3 border border-ocean-700/60 bg-ocean-900/80 p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
          <input className="border border-ocean-700 bg-ocean-950 px-3 py-2 text-sm text-white outline-none focus:border-signal-blue" placeholder="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <input className="border border-ocean-700 bg-ocean-950 px-3 py-2 text-sm text-white outline-none focus:border-signal-blue" placeholder="name" value={name} onChange={(event) => setName(event.target.value)} />
          <input className="border border-ocean-700 bg-ocean-950 px-3 py-2 text-sm text-white outline-none focus:border-signal-blue" placeholder="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <button className="flex h-10 items-center justify-center gap-1.5 bg-signal-blue px-4 text-sm font-semibold text-ocean-950">
            <Plus size={14} />
            Add
          </button>
        </form>

        {message && <p className="mb-3 text-sm text-signal-red">{message}</p>}

        <div className="overflow-hidden border border-ocean-700/60 bg-ocean-900/80">
          {users.map((user) => (
            <div key={user.id} className="grid gap-2 border-b border-ocean-700/50 p-3 last:border-b-0 md:grid-cols-[80px_1fr_1fr_1fr_auto_auto]">
              <div className="text-xs font-mono text-ocean-500">#{user.id}</div>
              <input className="border border-ocean-700 bg-ocean-950 px-2 py-1.5 text-sm text-white outline-none focus:border-signal-blue" value={user.email} onChange={(event) => updateUser(user.id, { email: event.target.value })} />
              <input className="border border-ocean-700 bg-ocean-950 px-2 py-1.5 text-sm text-white outline-none focus:border-signal-blue" value={user.name ?? ""} onChange={(event) => updateUser(user.id, { name: event.target.value })} />
              <input className="border border-ocean-700 bg-ocean-950 px-2 py-1.5 text-sm text-white outline-none focus:border-signal-blue" placeholder="new password" type="password" value={user.password ?? ""} onChange={(event) => updateUser(user.id, { password: event.target.value })} />
              <button onClick={() => saveUser(user)} className="flex h-9 items-center justify-center gap-1.5 border border-ocean-700 px-3 text-xs text-ocean-200 hover:border-signal-green hover:text-white">
                <Save size={13} />
                Save
              </button>
              <button onClick={() => deleteUser(user.id)} className="flex h-9 items-center justify-center gap-1.5 border border-ocean-700 px-3 text-xs text-ocean-400 hover:border-signal-red hover:text-white">
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
