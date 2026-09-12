"use client";

import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { AppointmentForm } from "@/components/appointments";
import { Reveal } from "@/components/motion";

/**
 * Serial section: online appointment form (saves a PENDING request) +
 * QR of the WhatsApp serial link. Rendered inside the doctor's personal
 * site (id="serial"). Without a `doctorUsername` (static demo) it falls
 * back to the WhatsApp-only guide.
 */
export function SerialSection({
  serialHref,
  waHref,
  doctorUsername,
}: {
  serialHref: string;
  waHref: string;
  doctorUsername?: string | null;
}) {
  return (
    <section id="serial" className="scroll-mt-24 bg-emerald-50/60">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <Reveal>
          <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            <span className="inline-block h-px w-10 bg-emerald-600" />
            অনলাইন সিরিয়াল
          </p>
          <h2 className="mt-3 max-w-xl text-3xl font-bold text-emerald-950 md:text-4xl">
            ঘরে বসেই সিরিয়াল নিন
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            নিচের ফর্মটি পূরণ করুন, অথবা QR কোড স্ক্যান করে সরাসরি হোয়াটসঅ্যাপে
            সিরিয়াল নিন।
          </p>
        </Reveal>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* ---------- Online form (saves to pending appointments) ---------- */}
          {doctorUsername ? (
            <AppointmentForm doctorUsername={doctorUsername} accent="emerald" />
          ) : (
            <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-emerald-900/10 md:p-8">
              <h3 className="text-xl font-bold text-emerald-950">যেভাবে সিরিয়াল নেবেন</h3>
              <ol className="mt-5 space-y-4">
                {[
                  {
                    n: "১",
                    t: "QR স্ক্যান বা লিংকে ক্লিক করুন",
                    d: "ক্যামেরা দিয়ে QR কোড স্ক্যান করলেই সিরিয়াল চ্যাট চালু হবে।",
                  },
                  {
                    n: "২",
                    t: "ডাক্তারের নামসহ মেসেজ যাবে",
                    d: "হোয়াটসঅ্যাপে ডাক্তারের নাম লেখা মেসেজ তৈরি থাকবে — শুধু পাঠিয়ে দিন।",
                  },
                  {
                    n: "৩",
                    t: "কনফার্মেশন নিয়ে চেম্বারে আসুন",
                    d: "উত্তর পেয়ে সময় নিশ্চিত করুন, তারপর সময়মতো চেম্বারে আসুন।",
                  },
                ].map((s) => (
                  <li key={s.n} className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-base font-bold text-white">
                      {s.n}
                    </span>
                    <div>
                      <p className="font-bold text-emerald-950">{s.t}</p>
                      <p className="mt-0.5 text-sm text-slate-600">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={serialHref}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-emerald-700 px-6 py-3 font-bold text-white hover:bg-emerald-800"
                >
                  ✆ সিরিয়াল লিংক খুলুন
                </a>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-emerald-700 px-6 py-3 font-semibold text-emerald-800 hover:bg-emerald-50"
                >
                  💬 সরাসরি হোয়াটসঅ্যাপ
                </a>
              </div>
            </div>
          )}

          {/* ---------- QR card ---------- */}
          <motion.div
            className="rounded-3xl bg-emerald-950 p-7 text-center text-white md:p-8"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}
