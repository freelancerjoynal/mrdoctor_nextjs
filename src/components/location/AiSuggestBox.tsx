"use client";

import { useState } from "react";
import { DoctorCard } from "@/components/sites/DoctorCard";
import type { LocationDoctor } from "@/components/sites/LocationSite";

interface AiResult {
  speciality_bn: string;
  speciality_en: string;
  doctors: LocationDoctor[];
  total: number;
}

/**
 * Thana-portal smart search — "কোন বিভাগের ডাক্তার দেখাবেন বুঝতে
 * পারছেন না? সমস্যা লিখুন, আমরা বের করে দিচ্ছি।"
 * Sends problem + age + weight to DeepSeek (same triage as the WhatsApp
 * chatbot), gets the category, and shows doctors from THIS thana only —
 * using the SAME universal card + popup as the main grid.
 */
export function AiSuggestBox({
  divisionBn,
  districtBn,
  thanaBn,
  thanaNames,
  areaTitle,
  host,
  onSelect,
}: {
  divisionBn: string;
  districtBn: string;
  thanaBn: string;
  thanaNames: string[];
  areaTitle: string;
  host: string;
  onSelect: (d: LocationDoctor) => void;
}) {
  const [problem, setProblem] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (problem.trim().length < 3 || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/backend/api/website/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: problem.trim(),
          age: age.trim() ? Number(age.trim()) : null,
          weight: weight.trim() ? Number(weight.trim()) : null,
          gender,
          division: divisionBn,
          district: districtBn,
          thana: thanaBn,
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        data?: AiResult;
        error?: string;
      } | null;
      if (!res.ok || !json?.data) {
        setError(json?.error || "দুঃখিত, সাজেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
        return;
      }
      setResult(json.data);
    } catch {
      setError("দুঃখিত, সাজেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="scroll-mt-24 bg-white py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-teal-100/70 bg-gradient-to-br from-white via-teal-50/60 to-cyan-100/50 px-5 py-8 shadow-[0_12px_48px_-20px_rgba(13,148,136,0.35)] sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-teal-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-12 h-56 w-56 rounded-full bg-cyan-200/50 blur-3xl" />
          <div className="relative mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-medium text-teal-700 shadow-sm ring-1 ring-teal-100">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              স্মার্ট সাজেশন
            </span>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-800 sm:text-2xl">
              কোন বিভাগের ডাক্তার দেখাবেন বুঝতে পারছেন না?
            </h2>
            <p className="mt-1.5 text-sm font-normal text-slate-500">
              সমস্যা, বয়স ও ওজন লিখুন — সঠিক বিভাগ বের করে {thanaBn} এলাকার
              ডাক্তার দেখিয়ে দিচ্ছি।
            </p>
          </div>
          <form
            onSubmit={onSubmit}
            className="relative mx-auto mt-6 flex max-w-3xl flex-col gap-2 rounded-3xl bg-white/80 p-2 shadow-sm ring-1 ring-white sm:flex-row sm:items-center sm:rounded-full sm:py-1.5 sm:pl-2 sm:pr-1.5"
          >
            <input
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="সমস্যা লিখুন (যেমন: ৩ দিন ধরে জ্বর ও কাশি)…"
              className="w-full flex-1 rounded-full bg-transparent px-4 py-2.5 text-sm font-normal text-slate-800 outline-none placeholder:text-slate-400"
            />
            <div className="flex gap-2">
              <div
                role="radiogroup"
                aria-label="লিঙ্গ"
                className="flex items-center rounded-full bg-slate-50 p-1 ring-1 ring-slate-100"
              >
                {(
                  [
                    { id: "male", label: "পুরুষ" },
                    { id: "female", label: "নারী" },
                  ] as const
                ).map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    role="radio"
                    aria-checked={gender === g.id}
                    onClick={() => setGender(g.id)}
                    className={`rounded-full px-4 py-1.5 text-sm font-normal transition ${
                      gender === g.id
                        ? "bg-white text-teal-700 shadow-sm ring-1 ring-teal-100"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
              <input
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="বয়স"
                inputMode="numeric"
                className="w-20 rounded-full bg-slate-50 px-3.5 py-2.5 text-center text-sm font-normal text-slate-800 outline-none ring-1 ring-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-400 sm:w-24"
              />
              <input
                value={weight}
                onChange={(e) => setWeight(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="ওজন কেজি"
                inputMode="numeric"
                className="w-24 rounded-full bg-slate-50 px-3.5 py-2.5 text-center text-sm font-normal text-slate-800 outline-none ring-1 ring-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-400 sm:w-28"
              />
            </div>
            <button
              type="submit"
              disabled={loading || problem.trim().length < 3}
              className="shrink-0 rounded-full bg-teal-600 px-7 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 active:scale-95 disabled:opacity-40"
            >
              {loading ? "খুঁজছি…" : "সাজেস্ট নিন"}
            </button>
          </form>

          {error ? (
            <p className="relative mx-auto mt-4 max-w-3xl rounded-2xl bg-red-50/80 px-4 py-2.5 text-center text-sm font-normal text-red-600 ring-1 ring-red-100">
              {error}
            </p>
          ) : null}

          {result ? (
            <div className="relative mt-6">
              <p className="mx-auto max-w-3xl rounded-full bg-emerald-50 px-5 py-2.5 text-center text-sm font-medium text-emerald-800 ring-1 ring-emerald-100">
                ✅ আপনার সমস্যা অনুযায়ী {result.speciality_bn} বিভাগের ডাক্তার
                দেখানো হচ্ছে ({result.total} জন)
              </p>
              {result.doctors.length === 0 ? (
                <p className="mx-auto mt-4 max-w-md rounded-2xl bg-white/80 p-6 text-center text-sm font-normal text-slate-400 ring-1 ring-slate-100">
                  😔 {thanaBn} এলাকায় এই বিভাগের ডাক্তার পাওয়া যায়নি। অন্য
                  লোকেশন চেষ্টা করুন।
                </p>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {result.doctors.map((d) => (
                    <DoctorCard
                      key={d.username}
                      doctor={d}
                      thanaNames={thanaNames}
                      areaTitle={areaTitle}
                      host={host}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
