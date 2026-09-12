"use client";

import { useMemo, useState, type FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";

export interface SerialChamber {
  id: string;
  name: string;
}

interface SerialResult {
  doctorName?: string;
  chamberName?: string | null;
  dayLabel?: string;
  patientName?: string;
  contactPhone?: string;
}

/** Dhaka running-day labels (আজ / আগামীকাল) for the day picker. */
function dayOptions(): Array<{ value: "today" | "tomorrow"; label: string }> {
  const fmt = new Intl.DateTimeFormat("bn-BD", {
    timeZone: "Asia/Dhaka",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const now = Date.now();
  const today = fmt.format(new Date(now));
  const tomorrow = fmt.format(new Date(now + 24 * 3600 * 1000));
  return [
    { value: "today", label: `আজ — ${today}` },
    { value: "tomorrow", label: `আগামীকাল — ${tomorrow}` },
  ];
}

/**
 * Online serial section: QR of the WhatsApp serial link + interactive
 * form saved to `pendingAppointment`. Rendered inside the doctor's
 * personal site (id="serial").
 */
export function SerialSection({
  username,
  chambers,
  serialHref,
}: {
  username: string;
  chambers: SerialChamber[];
  serialHref: string;
}) {
  const days = useMemo(() => dayOptions(), []);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [problem, setProblem] = useState("");
  const [chamberId, setChamberId] = useState("");
  const [day, setDay] = useState<"today" | "tomorrow">("today");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<SerialResult | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/serial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          patientName: name,
          contactPhone: phone,
          problem,
          chamberId: chamberId || undefined,
          day,
        }),
      });
      const json = (await res.json()) as { data?: SerialResult; error?: string };
      if (!res.ok) throw new Error(json.error || "সিরিয়াল নেওয়া যায়নি।");
      setResult(json.data ?? null);
      setStatus("success");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "সিরিয়াল নেওয়া যায়নি।");
      setStatus("error");
    }
  }

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

  return (
    <section id="serial" className="scroll-mt-24 bg-emerald-50/60">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          <span className="inline-block h-px w-10 bg-emerald-600" />
          অনলাইন সিরিয়াল
        </p>
        <h2 className="mt-3 max-w-xl text-3xl font-bold text-emerald-950 md:text-4xl">
          ঘরে বসেই সিরিয়াল নিন
        </h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          ফর্মটি পূরণ করুন, অথবা QR কোড স্ক্যান করে সরাসরি হোয়াটসঅ্যাপে সিরিয়াল নিন।
        </p>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* ---------- Form ---------- */}
          <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-emerald-900/10 md:p-8">
            {status === "success" ? (
              <div className="text-center">
                <p className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
                  ✓
                </p>
                <h3 className="mt-4 text-2xl font-bold text-emerald-950">
                  সিরিয়ালের অনুরোধ পেয়েছি!
                </h3>
                <p className="mt-3 leading-relaxed text-slate-600">
                  ধন্যবাদ{result?.patientName ? `, ${result.patientName}` : ""}! শীঘ্রই
                  আপনার হোয়াটসঅ্যাপে ({result?.contactPhone}) একটি কনফার্মেশন মেসেজ
                  যাবে
                  {result?.dayLabel ? (
                    <>
                      {" "}— <span className="font-semibold text-emerald-800">{result.dayLabel}</span>
                    </>
                  ) : null}
                  {result?.chamberName ? ` · ${result.chamberName}` : ""}। মেসেজের
                  পেমেন্ট লিংকে ক্লিক করে পেমেন্ট করলেই সিরিয়াল নিশ্চিত হবে।
                </p>
                <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
                  দ্রষ্টব্য: অনলাইন পেমেন্ট খুব শীঘ্রই যুক্ত হচ্ছে — আপাতত
                  কনফার্মেশন মেসেজের নির্দেশনা অনুসরণ করুন।
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <a
                    href={serialHref}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-emerald-700 px-6 py-3 font-bold text-white hover:bg-emerald-800"
                  >
                    হোয়াটসঅ্যাপে সিরিয়াল নিন
                  </a>
                  <button
                    onClick={() => {
                      setStatus("idle");
                      setResult(null);
                      setName("");
                      setPhone("");
                      setProblem("");
                      setChamberId("");
                    }}
                    className="rounded-full border border-emerald-700 px-6 py-3 font-semibold text-emerald-800 hover:bg-emerald-50"
                  >
                    আরেকটি সিরিয়াল
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                      রোগীর নাম *
                    </span>
                    <input
                      required
                      minLength={3}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="যেমন: রহিম উদ্দিন"
                      className={inputCls}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                      মোবাইল নম্বর *
                    </span>
                    <input
                      required
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className={inputCls}
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    সমস্যা সংক্ষেপে লিখুন *
                  </span>
                  <textarea
                    required
                    minLength={3}
                    rows={3}
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    placeholder="যেমন: ৫ দিন ধরে জ্বর ও মাথাব্যথা"
                    className={inputCls}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  {chambers.length > 0 && (
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                        চেম্বার
                      </span>
                      <select
                        value={chamberId}
                        onChange={(e) => setChamberId(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">যেকোনো চেম্বার</option>
                        {chambers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <fieldset className={chambers.length > 0 ? "" : "sm:col-span-2"}>
                    <legend className="mb-1.5 text-sm font-semibold text-slate-700">
                      কোন দিন আসতে চান?
                    </legend>
                    <div className="grid grid-cols-2 gap-2">
                      {days.map((d) => (
                        <label
                          key={d.value}
                          className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-semibold transition ${
                            day === d.value
                              ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                              : "border-slate-200 text-slate-600 hover:border-emerald-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="day"
                            value={d.value}
                            checked={day === d.value}
                            onChange={() => setDay(d.value)}
                            className="sr-only"
                          />
                          {d.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
                {status === "error" && (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
                    {message}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full rounded-full bg-emerald-700 px-6 py-3.5 font-bold text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-800 disabled:opacity-60"
                >
                  {status === "loading" ? "পাঠানো হচ্ছে…" : "✓ সিরিয়ালের অনুরোধ পাঠান"}
                </button>
                <p className="text-center text-xs text-slate-500">
                  জমা দিলে আপনার তথ্য ডাক্তারের কাছে সংরক্ষণ করা হবে।
                </p>
              </form>
            )}
          </div>

          {/* ---------- QR card ---------- */}
          <div className="rounded-3xl bg-emerald-950 p-7 text-center text-white md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
              QR স্ক্যান করুন
            </p>
            <h3 className="mt-2 text-xl font-bold">হোয়াটসঅ্যাপে সরাসরি সিরিয়াল</h3>
            <div className="mx-auto mt-5 w-fit rounded-2xl bg-white p-4 shadow-xl">
              <QRCodeSVG value={serialHref} size={190} level="M" />
            </div>
            <p className="mt-4 break-all text-xs text-emerald-100/70">{serialHref}</p>
            <a
              href={serialHref}
              target="_blank"
              rel="noreferrer"
              className="mt-5 block rounded-full bg-amber-400 px-6 py-3 font-bold text-emerald-950 hover:bg-amber-300"
            >
              হোয়াটসঅ্যাপে খুলুন
            </a>
            <p className="mt-3 text-xs text-emerald-100/60">
              ক্যামেরা দিয়ে স্ক্যান করলেই সিরিয়াল চ্যাট চালু হবে।
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
