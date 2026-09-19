import Link from "next/link";
import { HospitalDetailPanel } from "@/components/admin/HospitalDetailPanel";

/** /admin/hospitals/[id] — one hospital's bookings + income + payouts. */
export default async function AdminHospitalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-5">
      <Link href="/admin/directory" className="text-xs font-bold text-violet-600 hover:underline">
        ← তালিকায় ফিরুন
      </Link>
      <HospitalDetailPanel id={id} />
    </div>
  );
}
