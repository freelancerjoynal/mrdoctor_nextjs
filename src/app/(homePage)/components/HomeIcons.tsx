interface IconProps {
  className?: string;
}

function base(className?: string) {
  return className ?? "h-6 w-6";
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={base(className)}>
      <rect x="3" y="4.5" width="18" height="16" rx="3" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4" strokeLinecap="round" />
      <circle cx="12" cy="14.5" r="2.2" fill="currentColor" stroke="none" opacity={0.35} />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={base(className)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={base(className)}>
      <path d="M12 2.8 4.5 6v6c0 4.6 3.2 7.9 7.5 9.2 4.3-1.3 7.5-4.6 7.5-9.2V6L12 2.8Z" strokeLinejoin="round" />
      <path d="m9 11.5 2.2 2.2L15.5 9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={base(className)}>
      <path d="M21 12a8 8 0 0 1-8 8H4l2.3-2.9A8 8 0 1 1 21 12Z" strokeLinejoin="round" />
      <circle cx="9" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="13" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="17" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={base(className)}>
      <path d="M12 21.5S5 15.6 5 10.3A7 7 0 0 1 19 10.3C19 15.6 12 21.5 12 21.5Z" strokeLinejoin="round" />
      <circle cx="12" cy="10.3" r="2.6" />
    </svg>
  );
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={base(className)}>
      <path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" strokeLinejoin="round" />
    </svg>
  );
}

export function StethoscopeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={base(className)}>
      <path d="M5 3v5a4 4 0 0 0 8 0V3" strokeLinecap="round" />
      <path d="M5 3H3.5M10.5 3H12M9 12v3a5 5 0 0 0 10 0v-1" strokeLinecap="round" />
      <circle cx="19" cy="11" r="2.2" />
    </svg>
  );
}

export function HeartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={base(className)}>
      <path d="M12 20.5S3.5 15.4 3.5 9.6A4.6 4.6 0 0 1 8.1 5c1.6 0 3 .9 3.9 2.2A4.6 4.6 0 0 1 15.9 5a4.6 4.6 0 0 1 4.6 4.6c0 5.8-8.5 10.9-8.5 10.9Z" strokeLinejoin="round" />
    </svg>
  );
}
