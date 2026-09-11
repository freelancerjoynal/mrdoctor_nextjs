import { ROLE_META } from "@/lib/auth/constants";
import type { Role } from "@/lib/auth/types";

export function RoleBadge({ role }: { role: Role }) {
  const meta = ROLE_META[role];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${meta.gradient} px-3.5 py-1.5 text-xs font-bold text-white shadow-lg`}
    >
      <span>{meta.emoji}</span> {meta.label}
    </span>
  );
}
