import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { backendFetch } from "@/lib/auth/backend";
import { ChambersManager } from "./ChambersManager";
import { ChambersOverview } from "./ChambersOverview";
import type { ChamberRow, HospitalFacets } from "./types";

const EMPTY_FACETS: HospitalFacets = { divisions: [], districts: [], thanas: [] };

async function getInitial(accessToken: string): Promise<{ chambers: ChamberRow[]; facets: HospitalFacets }> {
  try {
    const [chambersRes, hospitalsRes] = await Promise.all([
      backendFetch("/api/users/chambers", { accessToken }),
      backendFetch("/api/users/chambers/hospitals/options", { accessToken }),
    ]);
    const chambersJson = (await chambersRes.json().catch(() => null)) as {
      data?: ChamberRow[];
    } | null;
    const hospitalsJson = (await hospitalsRes.json().catch(() => null)) as {
      facets?: HospitalFacets;
    } | null;
    return {
      chambers: Array.isArray(chambersJson?.data) ? chambersJson.data : [],
      facets: hospitalsJson?.facets ?? EMPTY_FACETS,
    };
  } catch {
    return { chambers: [], facets: EMPTY_FACETS };
  }
}

/** Server component — guard + initial data; interactive islands stay client-side. */
export default async function ChambersPage() {
  const data = await getProfile();
  if (!data) redirect("/login");
  const { session, profile } = data;
  if (session.role === "DOCTOR_STAFF" && profile?.canManageChambers !== true) {
    redirect("/dashboard");
  }
  if (session.role !== "DOCTOR" && session.role !== "DOCTOR_STAFF") {
    redirect("/dashboard");
  }
  const jar = await cookies();
  const access = jar.get("accessToken")?.value;
  const initial = access ? await getInitial(access) : { chambers: [], facets: EMPTY_FACETS };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900 sm:text-2xl">🏥 চেম্বার ও সময়সূচি</h1>
        <p className="mt-1 text-sm text-slate-500">
          চেম্বার যোগ/সম্পাদনা করুন, প্রতিটি চেম্বারে কখন (timing) ও কোন তারিখে/বারে
          (date availability) রোগী দেখবেন তা ঠিক করুন।
        </p>
      </div>
      <ChambersOverview rows={initial.chambers} />
      <ChambersManager initialChambers={initial.chambers} initialFacets={initial.facets} />
    </div>
  );
}
