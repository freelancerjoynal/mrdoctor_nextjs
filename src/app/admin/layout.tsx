import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { getDisplayName } from "@/lib/auth/displayName";
import { ROLE_META } from "@/lib/auth/constants";
import { isAdminRole } from "@/lib/auth/types";
import { AdminShell } from "@/components/admin/layout/AdminShell";

/**
 * Layout for the /admin section — SUPER_ADMIN + ADMIN_MANAGER only.
 * Sidebar navigation lives in components/admin/layout/*.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const data = await getProfile();
  if (!data) redirect("/login");
  if (!isAdminRole(data.session.role)) redirect("/dashboard");

  return (
    <AdminShell
      name={getDisplayName(data.session, data.profile)}
      roleLabel={ROLE_META[data.session.role].label}
    >
      {children}
    </AdminShell>
  );
}
