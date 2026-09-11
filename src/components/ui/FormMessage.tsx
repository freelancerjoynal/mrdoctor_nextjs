export function FormMessage({
  error,
  success,
}: {
  error?: string | null;
  success?: string | null;
}) {
  if (!error && !success) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={`rounded-xl px-4 py-2.5 text-sm font-medium ${
        error
          ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
      }`}
    >
      {error ?? success}
    </p>
  );
}
