import type { Metadata } from "next";
import { InfoShell, PolicySection, EnglishSummary } from "@/components/legal/InfoShell";
import { REFUND_BN, REFUND_EN, REFUND_UPDATED } from "@/content/legal/refund";

export const metadata: Metadata = {
  title: "রিটার্ন ও রিফান্ড পলিসি",
  description: "মিস্টার ডাক্তার — রিটার্ন ও রিফান্ড নীতি: কখন পূর্ণ রিফান্ড, কখন রিশিডিউল, কীভাবে আবেদন।",
};

export default function RefundPage() {
  return (
    <InfoShell
      eyebrow="Return & Refund Policy · রিটার্ন ও রিফান্ড"
      title="রিটার্ন ও রিফান্ড নীতি"
      description="অগ্রিম পেমেন্টে (BDT) সিরিয়াল কনফার্ম হয়। সেবা না হলে নিচের নিয়মে রিফান্ড বা ফ্রি রিশিডিউল পাবেন।"
      updated={REFUND_UPDATED}
      extra={<EnglishSummary sections={REFUND_EN} />}
    >
      {REFUND_BN.map((s) => (
        <PolicySection key={s.heading} heading={s.heading} body={s.body} />
      ))}
    </InfoShell>
  );
}
