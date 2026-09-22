"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormMessage } from "@/components/ui/FormMessage";
import { FadeIn } from "@/components/motion/FadeIn";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/backend/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: fd.get("identifier"),
        password: fd.get("password"),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      email?: string;
      emailSent?: boolean;
      smsSent?: boolean;
    };
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
      return;
    }
    const params = new URLSearchParams({
      email: data.email ?? String(fd.get("identifier")),
      purpose: "login",
      em: data.emailSent === false ? "0" : "1",
      sms: data.smsSent ? "1" : "0",
    });
    router.push(`/verify-otp?${params.toString()}`);
  };

  return (
    <FadeIn>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="login-identifier" className="mb-1 block pl-2 text-xs font-bold text-blue-100">
            ইমেইল বা মোবাইল নম্বর
          </label>
          <input
            id="login-identifier"
            name="identifier"
            required
            autoComplete="username"
            placeholder="you@clinic.com বা 01XXXXXXXXX"
            className="w-full rounded-full bg-white px-5 py-2.5 text-sm font-medium text-slate-900 shadow-inner outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-white/50"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="mb-1 block pl-2 text-xs font-bold text-blue-100">
            পাসওয়ার্ড
          </label>
          <div className="relative">
            <input
              id="login-password"
              name="password"
              type={showPw ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-full bg-white py-2.5 pl-5 pr-12 text-sm font-medium text-slate-900 shadow-inner outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-white/50"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full px-2.5 py-1 text-sm text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              {showPw ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-2 pt-0.5 text-xs font-semibold">
          <label className="flex cursor-pointer items-center gap-1.5 text-blue-100">
            <input
              type="checkbox"
              defaultChecked
              className="h-3.5 w-3.5 rounded accent-white"
            />
            মনে রাখুন
          </label>
          <Link href="/forgot-password" className="text-white hover:underline">
            পাসওয়ার্ড ভুলে গেছেন?
          </Link>
        </div>

        <FormMessage error={error} />
        <button
          disabled={loading}
          className="w-full rounded-full bg-white px-4 py-2.5 text-sm font-black text-blue-800 shadow-lg shadow-blue-950/30 transition hover:brightness-105 active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? "যাচাই হচ্ছে…" : "Log In → OTP"}
        </button>
        <p className="pt-0.5 text-center text-xs font-semibold text-blue-100/90">
          অ্যাকাউন্ট নেই?{" "}
          <Link href="/apply" className="font-black text-white hover:underline">
            আবেদন করুন
          </Link>
        </p>
      </form>
    </FadeIn>
  );
}
