"use client";

import { useMemo, useState } from "react";
import { DIVISIONS } from "@/lib/areas";
import { DoctorCard } from "@/components/sites/DoctorCard";
import { DoctorPortalModal } from "@/components/sites/DoctorPortalModal";
import type { LocationDoctor } from "@/components/sites/LocationSite";

interface AiResult {
  speciality_bn: string;
  speciality_en: string;
  doctors: LocationDoctor[];
  total: number;
}

export type AiFinderScope =
  /** Main site: division + district + thana selects, all mandatory. */
  | { type: "main" }
  /** District level: division fixed, thana select + age mandatory. */
  | { type: "district"; divisionBn: string; districtBn: string; thanas: string[] };

/**
 * Smart doctor search with location selects.
 * Problem + gender + age (+weight) go to DeepSeek (same triage as the
 * WhatsApp chatbot + thana box), the picked category is fetched from the
 * selected place, results use the universal card + popup.
 */
export function AiDoctorFinder({ scope, host }: { scope: AiFinderScope; host: string }) {
  const fixed = scope.type === "district" ? scope : null;
  const [division, setDivision] = useState(fixed?.divisionBn ?? "");
  const [district, setDistrict] = useState(fixed?.districtBn ?? "");
  const [thana, setThana] = useState("");
  const [problem, setProblem] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiResult | null>(null);
  const [resultPlace, setResultPlace] = useState("");
  const [selected, setSelected] = useState<LocationDoctor | null>(null);

  const districts = useMemo(
    () => DIVISIONS.find((d) => d.name === division)?.districts ?? [],
    [division],
  );
  const thanaOptions = useMemo(() => {
    if (fixed) return fixed.thanas;
    return districts.find((d) => d.name === district)?.thanas ?? [];
  }, [fixed, districts, district]);

  const placeLabel = [division, district, thana].filter(Boolean).join("-");

  function validate(): string | null {
    if (!division || !district || !thana) return "বিভাগ, জেলা ও থানা তিনটিই বেছে নিন।";
    if (problem.trim().length < 3) return "সমস্যাটি সংক্ষেপে লিখুন (কমপক্ষে ৩ অক্ষর)।";
    if (!age.trim() || Number(age.trim()) <= 0) return "বয়স লিখুন (সঠিক সাজেশনের জন্য বয়স আবশ্যক)।";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/backend/api/website/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: problem.trim(),
          age: Number(age.trim()),
          weight: weight.trim() ? Number(weight.trim()) : null,
          gender,
          division,
          district,
          thana,
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
      setResultPlace(placeLabel);
    } catch {
      setError("দুঃখিত, সাজেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  const selectCls =
    "w-full appearance-none rounded-full bg-white px-4 py-2.5 text-sm font-normal text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 disabled:opacity-50";

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
              {fixed
                ? `${fixed.districtBn} জেলার থানা বেছে সমস্যা, বয়স ও ওজন লিখুন — সঠিক বিভাগ বের করে ডাক্তার দেখিয়ে দিচ্ছি।`
                : "বিভাগ, জেলা ও থানা বেছে সমস্যা, বয়স ও ওজন লিখুন — সঠিক বিভাগ বের করে ওই এলাকার ডাক্তার দেখিয়ে দিচ্ছি।"}
            </p>
          </div>

          <form onSubmit={onSubmit} className="relative mx-auto mt-6 max-w-3xl space-y-2">
            <div className="grid gap-2 sm:grid-cols-3">
              {fixed ? (
                <p className="rounded-full bg-white/70 px-4 py-2.5 text-center text-sm font-normal text-slate-600 ring-1 ring-white sm:col-span-1">
                  📍 {fixed.divisionBn}-{fixed.districtBn}
                </p>
              ) : (
                <select
                  value={division}
                  onChange={(e) => {
                    setDivision(e.target.value);
                    setDistrict("");
                    setThana("");
                  }}
                  className={selectCls}
                >
                  <option value="">বিভাগ বেছে নিন *</option>
                  {DIVISIONS.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={fixed ? thana : district}
                onChange={(e) => {
                  if (fixed) setThana(e.target.value);
                  else {
                    setDistrict(e.target.value);
                    setThana("");
                  }
                }}
                disabled={fixed ? false : !division}
                className={selectCls}
              >
                <option value="">{fixed ? "থানা বেছে নিন *" : "জেলা বেছে নিন *"}</option>
                {(fixed ? thanaOptions : districts.map((d) => d.name)).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              {!fixed && (
                <select
                  value={thana}
                  onChange={(e) => setThana(e.target.value)}
                  disabled={!district}
                  className={selectCls}
                >
                  <option value="">থানা বেছে নিন *</option>
                  {thanaOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              )}
              {fixed && (
                <div
                  role="radiogroup"
                  aria-label="লিঙ্গ"
                  className="flex items-center justify-center rounded-full bg-white p-1 ring-1 ring-slate-200"
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
                      className={`flex-1 rounded-full px-4 py-1.5 text-sm font-normal transition ${
                        gender === g.id
                          ? "bg-teal-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 rounded-3xl bg-white/80 p-2 shadow-sm ring-1 ring-white sm:flex-row sm:items-center sm:rounded-full sm:py-1.5 sm:pl-2 sm:pr-1.5">
              <input
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="সমস্যা লিখুন (যেমন: ৩ দিন ধরে জ্বর ও কাশি)…"
                className="w-full flex-1 rounded-full bg-transparent px-4 py-2.5 text-sm font-normal text-slate-800 outline-none placeholder:text-slate-400"
              />
              <div className="flex gap-2">
                {!fixed && (
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
                )}
                <input
                  value={age}
                  onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="বয়স *"
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
                disabled={loading}
                className="shrink-0 rounded-full bg-teal-600 px-7 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 active:scale-95 disabled:opacity-40"
              >
                {loading ? "খুঁজছি…" : "সাজেস্ট নিন"}
              </button>
            </div>
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
                ({resultPlace}, {result.total} জন)
              </p>
              {result.doctors.length === 0 ? (
                <p className="mx-auto mt-4 max-w-md rounded-2xl bg-white/80 p-6 text-center text-sm font-normal text-slate-400 ring-1 ring-slate-100">
                  😔 {resultPlace} এলাকায় এই বিভাগের ডাক্তার পাওয়া যায়নি।
                  অন্য লোকেশন চেষ্টা করুন।
                </p>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {result.doctors.map((d) => (
                    <DoctorCard
                      key={d.username}
                      doctor={d}
                      thanaNames={thana ? [thana] : []}
                      areaTitle={thana || district}
                      host={host}
                      onSelect={setSelected}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
      <DoctorPortalModal
        doctor={selected}
        thanaNames={thana ? [thana] : []}
        areaTitle={thana || district || "এলাকা"}
        host={host}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
