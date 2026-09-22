import type { Metadata } from "next";
import { InfoShell, PolicySection, EnglishSummary } from "@/components/legal/InfoShell";
import { DELIVERY_BN, DELIVERY_EN, DELIVERY_UPDATED } from "@/content/legal/delivery";

export const metadata: Metadata = {
  title: "ডেলিভারি পলিসি",
  description: "মিস্টার ডাক্তার — ডেলিভারি পলিসি: সিরিয়াল কীভাবে ডেলিভার হয়, সময়সীমা ও ফি (BDT)।",
};

export default function DeliveryPage() {
  return (
    <InfoShell
      eyebrow="Delivery Policy · ডেলিভারি পলিসি"
      title="সেবা প্রদান (ডেলিভারি) নীতি"
      description="আমরা ভৌত পণ্য বিক্রি করি না — 'ডেলিভারি' মানে সফটওয়্যারে সিরিয়াল যোগ হওয়া ও চেম্বারে সেবা পাওয়া।"
      updated={DELIVERY_UPDATED}
      extra={<EnglishSummary sections={DELIVERY_EN} />}
    >
      {DELIVERY_BN.map((s) => (
        <PolicySection key={s.heading} heading={s.heading} body={s.body} />
      ))}
    </InfoShell>
  );
}
