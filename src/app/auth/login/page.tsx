"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      router.push(data.role === "ADMIN" || data.role === "SUPER_ADMIN" ? "/admin" : redirect);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#030306" }}>
      <div className="w-full max-w-md">
        <div className="card">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center">
              <Image src="/logo.png" alt="Slip" width={120} height={40} priority className="h-9 w-auto" />
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-white">Welcome to Slip</h1>
          <p className="mt-1 text-sm text-muted">Digital tipping made simple</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-muted mb-2">
                Phone Number
              </label>
              <input
                id="identifier"
                type="tel"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="input-field"
                placeholder="e.g. 066 299 5533"
              />
              <p className="mt-1 text-xs text-muted-300">Admin? Use your email address instead</p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="enter your password..."
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-surface-100">
            <p className="text-center text-sm text-muted-200">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="font-semibold text-accent hover:text-accent-300 transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>Loading...</div></div>}>
      <LoginForm />
    </Suspense>
  );
}
