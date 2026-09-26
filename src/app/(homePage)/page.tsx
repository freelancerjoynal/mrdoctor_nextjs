import type { Metadata } from "next";
import { HomeHeader } from "./components/HomeHeader";
import { FAQS } from "./components/Faq";
import {
  fetchPageSeo,
  buildPageMetadata,
  organizationJsonLd,
  websiteJsonLd,
  faqJsonLd,
  withExtra,
  JsonLd,
} from "@/lib/seo";
import { headers } from "next/headers";
import { Hero } from "./components/Hero";
import { LocationAutoRedirect } from "@/components/location/LocationAutoRedirect";
import { AiDoctorFinder } from "@/components/location/AiDoctorFinder";
import { AreaExplorer } from "./components/AreaExplorer";
import { ConnectionTrio } from "./components/ConnectionTrio";
import { HowItWorks } from "./components/HowItWorks";
import { FreeSoftware } from "./components/FreeSoftware";
import { Specialities } from "./components/Specialities";
import { WhyUs } from "./components/WhyUs";
import { DoctorJoin } from "./components/DoctorJoin";
import { Testimonials } from "./components/Testimonials";
import { Faq } from "./components/Faq";
import { CtaBanner } from "./components/CtaBanner";
import { HomeFooter } from "./components/HomeFooter";
import { getLocationTree } from "@/lib/locations";
import { DIVISIONS } from "@/lib/areas";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await fetchPageSeo("GLOBAL", "home");
  return buildPageMetadata(seo, {
    defaultTitle: "মিস্টার ডাক্তার — ঘরে বসে ফ্রি ডাক্তারের সিরিয়াল",
    defaultDescription:
      "আপনার এলাকা বেছে অনলাইনে ডাক্তারের সিরিয়াল নিন — ৬৪ জেলা, ৪৯৪+ থানা ও উপজেলার যাচাইকৃত ডাক্তার, চেম্বার ও হাসপাতাল। ডাক্তার ও হাসপাতালের সফটওয়্যার সম্পূর্ণ ফ্রি।",
    canonical: "/",
    ogImage: "/logo-main.png",
  });
}

export default async function HomePage() {
  const { tree } = await getLocationTree();
  // Hero always shows full-country coverage (64 districts, 494 thanas),
  // not just the areas with live chamber data yet.
  const districts = DIVISIONS.reduce((n, d) => n + d.districts.length, 0);
  const thanas = DIVISIONS.reduce(
    (n, d) => n + d.districts.reduce((m, x) => m + x.thanas.length, 0),
    0,
  );
  const seo = await fetchPageSeo("GLOBAL", "home");
  const schemas = withExtra(seo, [organizationJsonLd(), websiteJsonLd(), faqJsonLd(FAQS)]);
  const host = (await headers()).get("host") ?? "";

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {schemas.map((s, i) => (
        <JsonLd key={i} data={s} />
      ))}
      <HomeHeader />
      <main>
        <Hero districts={districts} thanas={thanas} h1={seo?.h1?.trim() || null} />
        {/* Location finding comes first — no doctor/hospital lists on the
            homepage, only area → thana portals. */}
        <AreaExplorer tree={tree} />
        <AiDoctorFinder scope={{ type: "main" }} host={host} />
        <ConnectionTrio />
        <HowItWorks />
        <FreeSoftware />
        <Specialities />
        <WhyUs />
        <DoctorJoin />
        <Testimonials />
        <Faq />
        <CtaBanner />
      </main>
      <HomeFooter />
      <LocationAutoRedirect />
    </div>
  );
}
