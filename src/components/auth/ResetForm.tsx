"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { TextInput } from "@/components/ui/TextInput";
import { FormMessage } from "@/components/ui/FormMessage";
import { FadeIn } from "@/components/motion/FadeIn";

/** Backend verifies OTP and emails a fresh generated password. */
export function ResetForm({ email }: { email: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/backend/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: String(fd.get("otp")).trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "ভুল বা মেয়াদোত্তীর্ণ OTP।");
      return;
    }
    setDone(data.message ?? "আপনার ইমেইলে নতুন পাসওয়ার্ড পাঠানো হয়েছে।");
    setTimeout(() => router.push("/login"), 2500);
  }

  return (
    <FadeIn>
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <TextInput label="রিসেট OTP" name="otp" inputMode="numeric" required minLength={6} maxLength={6} placeholder="••••••" />
          <FormMessage error={error} success={done} />
          <button
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-600/25 transition hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "রিসেট হচ্ছে…" : "রিসেট নিশ্চিত করুন"}
          </button>
        </form>
      </Card>
    </FadeIn>
  );
}
