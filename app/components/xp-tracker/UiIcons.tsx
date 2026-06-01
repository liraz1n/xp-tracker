type IconProps = {
  className?: string;
};

const baseProps = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeWidth: 2,
  viewBox: "0 0 24 24",
} as const;

export function SunIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps}>
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a7 7 0 1 0 11 11Z" />
    </svg>
  );
}

export function ScrollIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps}>
      <path d="M8 21h9a3 3 0 0 0 3-3V5a2 2 0 0 0-2-2H7a3 3 0 0 0-3 3v14" />
      <path d="M4 20a2 2 0 0 1 2-2h11M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}

export function CreditCardIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M7 15h3" />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps}>
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
    </svg>
  );
}

export function CloudIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps}>
      <path d="M17.5 18H8a5 5 0 1 1 1.1-9.88A6 6 0 0 1 20 11.5 3.5 3.5 0 0 1 17.5 18Z" />
    </svg>
  );
}

export function PowerIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps}>
      <path d="M12 2v10" />
      <path d="M18.36 6.64a9 9 0 1 1-12.72 0" />
    </svg>
  );
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps}>
      <path d="M4 19V5M4 19h16" />
      <path d="m7 15 3-3 3 2 5-7" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps}>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M3 10h18" />
    </svg>
  );
}

export function FlagIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps}>
      <path d="M5 21V4" />
      <path d="M5 4h10l-1 4 1 4H5" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}
