import Link from "next/link";
import { DoctorDetailPanel } from "@/components/admin/DoctorDetailPanel";

/** /admin/doctors/[id] — one doctor's bookings + income. */
export default async function AdminDoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-5">
      <Link href="/admin/directory" className="text-xs font-bold text-violet-600 hover:underline">
        ← তালিকায় ফিরুন
      </Link>
      <DoctorDetailPanel id={id} />
    </div>
  );
}
