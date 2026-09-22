"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { TextInput } from "@/components/ui/TextInput";
import { FormMessage } from "@/components/ui/FormMessage";
import { FadeIn } from "@/components/motion/FadeIn";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <TextInput
            label="ইমেইল বা মোবাইল নম্বর"
            name="identifier"
            required
            placeholder="you@clinic.com বা 01XXXXXXXXX"
          />
          <div>
            <TextInput label="পাসওয়ার্ড" name="password" type="password" required placeholder="••••••••" />
            <div className="mt-2 text-right">
              <Link
                href="/forgot-password"
                className="text-sm font-bold text-indigo-600 hover:underline"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </Link>
            </div>
          </div>
          <FormMessage error={error} />
          <button
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "যাচাই হচ্ছে…" : "এগিয়ে যান → OTP"}
          </button>
        </form>
      </Card>
    </FadeIn>
  );
}
