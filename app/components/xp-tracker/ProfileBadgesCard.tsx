import type { BillingState } from "~/hooks/useBilling";

interface ProfileBadgesCardProps {
  billing: BillingState;
}

export function getProfileBadges(billing: BillingState) {
  const couponCode = billing.subscription?.coupon_code?.toUpperCase();

  return [
    billing.isSuperAdmin
      ? {
          label: "Superadmin",
          description: "Acesso administrativo exclusivo.",
          className: "border-sky-400/40 bg-sky-500/15 text-sky-200",
        }
      : null,
    couponCode === "FOUNDERS"
      ? {
          label: "Fundador",
          description: "Apoiador fundador do XP Tracker.",
          className: "border-emerald-400/35 bg-emerald-500/10 text-emerald-300",
        }
      : null,
    couponCode === "TOFUS"
      ? {
          label: "Tofus",
          description: "Badge especial do cupom TOFUS.",
          className: "border-cyan-400/35 bg-cyan-500/10 text-cyan-300",
        }
      : null,
  ].filter((badge): badge is { label: string; description: string; className: string } =>
    Boolean(badge)
  );
}

export function ProfileBadgesCard({ billing }: ProfileBadgesCardProps) {
  const badges = getProfileBadges(billing);

  if (badges.length === 0) return null;

  return (
    <section className="mb-4 md:mb-5 flex flex-wrap items-center gap-2">
      <span className="text-xs font-black uppercase text-sky-400">
        Selos:
      </span>

      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <span
            key={badge.label}
            title={badge.description}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black ${badge.className}`}
          >
            {badge.label}
          </span>
        ))}
      </div>
    </section>
  );
}
