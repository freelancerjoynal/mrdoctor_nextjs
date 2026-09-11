"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { TextInput } from "@/components/ui/TextInput";
import { FormMessage } from "@/components/ui/FormMessage";
import { FadeIn } from "@/components/motion/FadeIn";

export function ForgotForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const res = await fetch("/api/backend/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "রিসেট OTP পাঠানো যায়নি।");
      return;
    }
    router.push(`/reset-password?email=${encodeURIComponent(email)}`);
  }

  return (
    <FadeIn>
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <TextInput label="অ্যাকাউন্টের ইমেইল" name="email" type="email" required placeholder="you@clinic.com" />
          <FormMessage error={error} />
          <button
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-600/25 transition hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "OTP পাঠানো হচ্ছে…" : "রিসেট OTP পাঠান"}
          </button>
        </form>
      </Card>
    </FadeIn>
  );
}
