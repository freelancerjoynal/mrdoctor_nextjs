interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function TextInput({ label, ...rest }: Props) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      <input
        {...rest}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 sm:px-4 sm:text-sm"
      />
    </label>
  );
}
