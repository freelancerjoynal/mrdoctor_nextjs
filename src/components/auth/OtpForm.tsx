"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { TextInput } from "@/components/ui/TextInput";
import { FormMessage } from "@/components/ui/FormMessage";
import { FadeIn } from "@/components/motion/FadeIn";

/** One OTP box used after signup AND after login (backend: POST /verify). */
export function OtpForm({ email }: { email: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/backend/api/auth/verify", {
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
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <FadeIn>
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <TextInput
            label="৬ সংখ্যার OTP"
            name="otp"
            inputMode="numeric"
            required
            minLength={6}
            maxLength={6}
            placeholder="••••••"
          />
          <FormMessage error={error} />
          <button
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-fuchsia-600/25 transition hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "যাচাই হচ্ছে…" : "যাচাই করে ড্যাশবোর্ডে যান"}
          </button>
          <p className="text-center text-xs text-slate-400">
            ইনবক্স / স্প্যাম / SMS দেখুন — OTP ১০ মিনিটে মেয়াদ শেষ হয়।
          </p>
        </form>
      </Card>
    </FadeIn>
  );
}
