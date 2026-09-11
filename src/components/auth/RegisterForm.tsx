"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { TextInput } from "@/components/ui/TextInput";
import { FormMessage } from "@/components/ui/FormMessage";
import { FadeIn } from "@/components/motion/FadeIn";
import { ROLE_OPTIONS } from "@/lib/auth/constants";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/backend/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
        role: fd.get("role"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
      return;
    }
    router.push(`/verify-otp?email=${encodeURIComponent(String(fd.get("email")))}&purpose=signup`);
  }

  return (
    <FadeIn delay={0.05}>
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <TextInput label="ইমেইল" name="email" type="email" required placeholder="you@clinic.com" />
          <TextInput label="পাসওয়ার্ড" name="password" type="password" required minLength={6} placeholder="কমপক্ষে ৬ অক্ষর" />
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">ভূমিকা</span>
            <select
              name="role"
              defaultValue="DOCTOR"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-base text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 sm:px-4 sm:text-sm"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </label>
          <FormMessage error={error} />
          <button
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "অ্যাকাউন্ট তৈরি হচ্ছে…" : "অ্যাকাউন্ট খুলুন"}
          </button>
        </form>
      </Card>
    </FadeIn>
  );
}
