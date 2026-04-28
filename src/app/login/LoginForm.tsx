"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { Waves } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/",
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    window.location.assign(result?.url || "/");
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm border border-ocean-700/60 bg-ocean-900/95 p-5 shadow-2xl">
      <div className="mb-5 flex items-center gap-2">
        <Waves size={22} className="text-signal-blue" />
        <div>
          <h1 className="font-display text-lg font-semibold text-white">TrawlerWatch</h1>
          <p className="text-xs text-ocean-400">Basic Baked Users Auth</p>
        </div>
      </div>

      <label className="mb-3 block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ocean-400">Email</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          autoComplete="email"
          className="w-full border border-ocean-700 bg-ocean-950 px-3 py-2 text-sm text-white outline-none focus:border-signal-blue"
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ocean-400">Password</span>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          autoComplete="current-password"
          className="w-full border border-ocean-700 bg-ocean-950 px-3 py-2 text-sm text-white outline-none focus:border-signal-blue"
        />
      </label>

      {error && <p className="mb-3 text-xs text-signal-red">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-signal-blue px-3 py-2 text-sm font-semibold text-ocean-950 transition-opacity disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
