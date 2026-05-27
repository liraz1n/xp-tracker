import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "~/supabase";

export const PREMIUM_PRICE_CENTS = 500;
export const TRIAL_DAYS = 7;

export type BillingAccessStatus =
  | "guest"
  | "loading"
  | "trialing"
  | "active"
  | "locked"
  | "setup_pending";

type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

interface UserSubscriptionRow {
  status: SubscriptionStatus;
  plan: string;
  trial_ends_at: string | null;
  current_period_ends_at: string | null;
  coupon_code: string | null;
  discount_percent: number | null;
  discount_amount_cents: number | null;
  discount_ends_at: string | null;
}

export interface CouponPreview {
  code: string;
  title: string;
  description: string;
}

export interface BillingState {
  accessStatus: BillingAccessStatus;
  canUsePremiumFeatures: boolean;
  canUseCloudSync: boolean;
  loading: boolean;
  setupPending: boolean;
  subscription: UserSubscriptionRow | null;
  trialDaysRemaining: number | null;
  trialEndsAt: string | null;
  planLabel: string;
  priceLabel: string;
}

export const COUPON_PREVIEWS: CouponPreview[] = [
  {
    code: "BETA50",
    title: "50% por 3 meses",
    description: "Ideal para os primeiros jogadores testarem o Premium pagando metade.",
  },
  {
    code: "LIRA",
    title: "Primeiro mês grátis",
    description: "Libera o primeiro mês para experimentar o plano completo.",
  },
  {
    code: "FOUNDERS",
    title: "R$ 2,50/mês",
    description: "Cupom limitado para os primeiros apoiadores do XP Tracker.",
  },
];

export function formatCurrencyCents(value: number) {
  return (value / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function findCouponPreview(code: string) {
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) return null;

  return (
    COUPON_PREVIEWS.find((coupon) => coupon.code === normalizedCode) ?? null
  );
}

function daysUntil(dateValue: string | null) {
  if (!dateValue) return null;

  const targetDate = new Date(dateValue);
  const diff = targetDate.getTime() - Date.now();

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function isFutureDate(dateValue: string | null) {
  if (!dateValue) return false;

  return new Date(dateValue).getTime() > Date.now();
}

function resolveAccessStatus(
  subscription: UserSubscriptionRow | null
): BillingAccessStatus {
  if (!subscription) return "setup_pending";

  if (subscription.status === "active") return "active";

  if (
    subscription.status === "trialing" &&
    isFutureDate(subscription.trial_ends_at)
  ) {
    return "trialing";
  }

  if (
    subscription.status === "canceled" &&
    isFutureDate(subscription.current_period_ends_at)
  ) {
    return "active";
  }

  return "locked";
}

export function useBilling({
  user,
  guestMode,
  progressLoaded,
}: {
  user: User | null;
  guestMode: boolean;
  progressLoaded: boolean;
}): BillingState {
  const [subscription, setSubscription] =
    useState<UserSubscriptionRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [setupPending, setSetupPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSubscription(userId: string) {
      setLoading(true);
      setSetupPending(false);

      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(
          "status, plan, trial_ends_at, current_period_ends_at, coupon_code, discount_percent, discount_amount_cents, discount_ends_at"
        )
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.warn("Assinaturas ainda não configuradas:", error);
        setSubscription(null);
        setSetupPending(true);
        setLoading(false);
        return;
      }

      setSubscription((data as UserSubscriptionRow | null) ?? null);
      setSetupPending(!data);
      setLoading(false);
    }

    if (guestMode || !user || !progressLoaded) {
      setSubscription(null);
      setLoading(false);
      setSetupPending(false);
      return;
    }

    loadSubscription(user.id);

    return () => {
      cancelled = true;
    };
  }, [guestMode, progressLoaded, user]);

  return useMemo(() => {
    if (guestMode) {
      return {
        accessStatus: "guest",
        canUsePremiumFeatures: true,
        canUseCloudSync: false,
        loading: false,
        setupPending: false,
        subscription: null,
        trialDaysRemaining: null,
        trialEndsAt: null,
        planLabel: "Visitante",
        priceLabel: formatCurrencyCents(PREMIUM_PRICE_CENTS),
      };
    }

    if (loading) {
      return {
        accessStatus: "loading",
        canUsePremiumFeatures: true,
        canUseCloudSync: true,
        loading,
        setupPending,
        subscription,
        trialDaysRemaining: null,
        trialEndsAt: null,
        planLabel: "Carregando plano",
        priceLabel: formatCurrencyCents(PREMIUM_PRICE_CENTS),
      };
    }

    const accessStatus = setupPending
      ? "setup_pending"
      : resolveAccessStatus(subscription);
    const hasAccess =
      accessStatus === "trialing" ||
      accessStatus === "active" ||
      accessStatus === "setup_pending";

    return {
      accessStatus,
      canUsePremiumFeatures: hasAccess,
      canUseCloudSync: hasAccess,
      loading,
      setupPending,
      subscription,
      trialDaysRemaining: daysUntil(subscription?.trial_ends_at ?? null),
      trialEndsAt: subscription?.trial_ends_at ?? null,
      planLabel: accessStatus === "active" ? "Premium" : "Teste grátis",
      priceLabel: formatCurrencyCents(PREMIUM_PRICE_CENTS),
    };
  }, [guestMode, loading, setupPending, subscription]);
}
