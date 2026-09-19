"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { TextInput } from "@/components/ui/TextInput";
import { FormMessage } from "@/components/ui/FormMessage";
import { FadeIn } from "@/components/motion/FadeIn";

export function HospitalApplyForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/backend/api/applications/hospital", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hospitalName: fd.get("hospitalName"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        slug: fd.get("slug") || undefined,
        division: fd.get("division"),
        district: fd.get("district"),
        thana: fd.get("thana"),
        addressLine: fd.get("addressLine") || undefined,
        foundUs: fd.get("foundUs") || undefined,
        joinReason: fd.get("joinReason") || undefined,
        note: fd.get("note") || undefined,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "আবেদন জমা দেওয়া যায়নি। আবার চেষ্টা করুন।");
      return;
    }
    setOk(true);
  }

  if (ok) {
    return (
      <FadeIn delay={0.05}>
        <Card>
          <div className="py-6 text-center">
            <p className="text-4xl">✅</p>
            <p className="mt-3 text-lg font-black text-slate-900">
              We have received your application.
            </p>
            <p className="mt-1 text-sm font-bold text-slate-700">
              Our representative will call you soon to confirm the application.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              আপনার আবেদন পেয়েছি! আমাদের প্রতিনিধি শীঘ্রই ফোন করে আবেদন নিশ্চিত করবেন।
            </p>
          </div>
        </Card>
      </FadeIn>
    );
  }

  return (
    <FadeIn delay={0.05}>
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <TextInput label="হাসপাতালের নাম" name="hospitalName" required placeholder="নীলফামারী সদর হাসপাতাল" />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="ইমেইল" name="email" type="email" required placeholder="info@hospital.com" />
            <TextInput label="ফোন" name="phone" required placeholder="01700000000" />
          </div>
          <TextInput label="পছন্দের স্লাগ (ঐচ্ছিক)" name="slug" placeholder="nilphamari-sadar-hospital" />
          <div className="grid gap-4 sm:grid-cols-3">
            <TextInput label="বিভাগ" name="division" required placeholder="রংপুর" />
            <TextInput label="জেলা" name="district" required placeholder="নীলফামারী" />
            <TextInput label="থানা" name="thana" required placeholder="নীলফামারী সদর" />
          </div>
          <TextInput label="ঠিকানা (ঐচ্ছিক)" name="addressLine" placeholder="সদর, নীলফামারী" />
          <TextInput
            label="আমাদের সম্পর্কে কোথায় জানলেন? (ঐচ্ছিক)"
            name="foundUs"
            placeholder="ফেসবুক / পরিচিতজনের মাধ্যমে / গুগল…"
          />
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              কেন আমাদের সাথে যোগ দিতে চান? (ঐচ্ছিক)
            </span>
            <textarea
              name="joinReason"
              rows={3}
              placeholder="আপনার কারণ লিখুন…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 sm:px-4 sm:text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              অতিরিক্ত তথ্য (ঐচ্ছিক)
            </span>
            <textarea
              name="note"
              rows={3}
              placeholder="শয্যা সংখ্যা, বিভাগ বা অন্য কিছু…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 sm:px-4 sm:text-sm"
            />
          </label>
          <FormMessage error={error} />
          <button
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-600/25 transition hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "জমা হচ্ছে…" : "হাসপাতাল হিসেবে আবেদন করুন"}
          </button>
        </form>
      </Card>
    </FadeIn>
  );
}
