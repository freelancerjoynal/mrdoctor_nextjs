import { HomeHeader } from "./components/HomeHeader";
import { Hero } from "./components/Hero";
import { LocationAutoRedirect } from "@/components/location/LocationAutoRedirect";
import { LocationSwitcher } from "@/components/location/LocationSwitcher";
import { Specialities } from "./components/Specialities";
import { AreaExplorer } from "./components/AreaExplorer";
import { HowItWorks } from "./components/HowItWorks";
import { WhyUs } from "./components/WhyUs";
import { DoctorJoin } from "./components/DoctorJoin";
import { Testimonials } from "./components/Testimonials";
import { Faq } from "./components/Faq";
import { RoleStrip } from "./components/RoleStrip";
import { CtaBanner } from "./components/CtaBanner";
import { HomeFooter } from "./components/HomeFooter";
import { getLocationTree, treeTotals } from "@/lib/locations";

export default async function HomePage() {
  const { tree } = await getLocationTree();
  const { districts, thanas } = treeTotals(tree);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <HomeHeader />
      <main>
        <Hero districts={districts} thanas={thanas} />
        <Specialities />
        <AreaExplorer tree={tree} />
        <HowItWorks />
        <WhyUs />
        <DoctorJoin />
        <Testimonials />
        <Faq />
        <RoleStrip />
        <CtaBanner />
      </main>
      <HomeFooter />
      <LocationAutoRedirect />
      <LocationSwitcher />
    </div>
  );
}
