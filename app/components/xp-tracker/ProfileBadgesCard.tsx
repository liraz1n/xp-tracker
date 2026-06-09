import type { BillingState } from "~/hooks/useBilling";

interface ProfileBadgesCardProps {
  billing: BillingState;
}

export interface ProfileBadge {
  label: string;
  description: string;
  className: string;
}

export function getProfileBadges(billing: BillingState) {
  const couponCode = billing.subscription?.coupon_code?.toUpperCase();
  const isFounder =
    couponCode === "FOUNDERS" || billing.subscription?.plan === "premium_lifetime";
  const isPremium =
    billing.accessStatus === "active" || billing.subscription?.status === "active";

  return [
    billing.isSuperAdmin
      ? {
          label: "Superadmin",
          description: "Acesso administrativo exclusivo.",
          className: "border-yellow-400/40 bg-yellow-500/15 text-yellow-200",
        }
      : null,
    isPremium && !billing.isSuperAdmin && !isFounder
      ? {
          label: "Premium",
          description: "Assinatura Premium ativa.",
          className: "border-yellow-400/35 bg-yellow-500/10 text-yellow-200",
        }
      : null,
    isFounder
      ? {
          label: "FOUNDERS",
          description:
            "Selo dos 10 primeiros usuários que garantiram o plano vitalício.",
          className: "border-emerald-400/35 bg-emerald-500/10 text-emerald-300",
        }
      : null,
    couponCode === "TOFUS"
      ? {
          label: "TOFUS",
          description: "Selo para usuários que aderiram com o cupom TOFUS.",
          className: "border-cyan-400/35 bg-cyan-500/10 text-cyan-300",
        }
      : null,
  ].filter((badge): badge is ProfileBadge => Boolean(badge));
}

export function ProfileBadgesCard({ billing }: ProfileBadgesCardProps) {
  const badges = getProfileBadges(billing);

  if (badges.length === 0) return null;

  return (
    <section className="mb-4 md:mb-5 flex flex-wrap items-center gap-2">
      <span className="text-xs font-black uppercase text-yellow-400">
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
