import type { Metadata } from "next";
import { InfoShell, PolicySection, EnglishSummary } from "@/components/legal/InfoShell";
import { TERMS_BN, TERMS_EN, TERMS_UPDATED } from "@/content/legal/terms";

export const metadata: Metadata = {
  title: "শর্তাবলী",
  description: "মিস্টার ডাক্তার — টার্মস অ্যান্ড কন্ডিশনস: বুকিং, পেমেন্ট (BDT), রিশিডিউল ও দায়িত্ব।",
};

export default function TermsPage() {
  return (
    <InfoShell
      eyebrow="Terms & Conditions · শর্তাবলী"
      title="ব্যবহারের শর্তাবলী"
      description="সিরিয়াল বুকিং, অগ্রিম পেমেন্ট (BDT), সেবা গ্রহণ ও ডাক্তার-পেমেন্ট মডেলের নিয়ম। বুকিং ফর্মে টিক দিয়ে আপনি এই শর্তে সম্মত হন।"
      updated={TERMS_UPDATED}
      extra={<EnglishSummary sections={TERMS_EN} />}
    >
      {TERMS_BN.map((s) => (
        <PolicySection key={s.heading} heading={s.heading} body={s.body} />
      ))}
    </InfoShell>
  );
}
