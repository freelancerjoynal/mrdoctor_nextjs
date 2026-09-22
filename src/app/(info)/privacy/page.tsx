import type { Metadata } from "next";
import { InfoShell, PolicySection, EnglishSummary } from "@/components/legal/InfoShell";
import { PRIVACY_BN, PRIVACY_EN, PRIVACY_UPDATED } from "@/content/legal/privacy";

export const metadata: Metadata = {
  title: "প্রাইভেসি পলিসি",
  description: "মিস্টার ডাক্তার — প্রাইভেসি পলিসি: কী তথ্য নিই, কী কাজে লাগে, কার সঙ্গে শেয়ার হয়।",
};

export default function PrivacyPage() {
  return (
    <InfoShell
      eyebrow="Privacy Policy · প্রাইভেসি পলিসি"
      title="তথ্যের গোপনীয়তা নীতি"
      description="বুকিং ও পেমেন্টে আপনার কোন তথ্য নেওয়া হয়, কীভাবে ব্যবহার ও সুরক্ষিত থাকে।"
      updated={PRIVACY_UPDATED}
      extra={<EnglishSummary sections={PRIVACY_EN} />}
    >
      {PRIVACY_BN.map((s) => (
        <PolicySection key={s.heading} heading={s.heading} body={s.body} />
      ))}
    </InfoShell>
  );
}
