import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "~/supabase";

export const PREMIUM_PRICE_CENTS = 599;
export const TRIAL_DAYS = 3;
export const SUPERADMIN_EMAILS = ["ewertonpro11@gmail.com"];

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

export type CheckoutPaymentMode = "card" | "pix";

export interface ReferralSummary {
  code: string;
  qualifiedReferrals: number;
  creditsEarned: number;
  creditsUsed: number;
  creditsAvailable: number;
  availableCents: number;
  nextCreditProgress: number;
}

export interface BillingState {
  accessStatus: BillingAccessStatus;
  isSuperAdmin: boolean;
  canUsePremiumFeatures: boolean;
  canUseCloudSync: boolean;
  loading: boolean;
  setupPending: boolean;
  subscription: UserSubscriptionRow | null;
  trialDaysRemaining: number | null;
  trialEndsAt: string | null;
  planLabel: string;
  priceLabel: string;
  referralSummary: ReferralSummary | null;
  referralLoading: boolean;
  referralError: string | null;
  checkoutLoading: boolean;
  checkoutError: string | null;
  startCheckout: (
    couponCode?: string,
    paymentMode?: CheckoutPaymentMode,
    useReferralCredits?: boolean
  ) => Promise<void>;
  reloadReferralSummary: () => Promise<void>;
}

export const ACTIVE_COUPON_PREVIEWS: CouponPreview[] = [
  {
    code: "BETA50",
    title: "50% por 6 meses",
    description: "Desconto para plano recorrente durante os 6 primeiros meses.",
  },
  {
    code: "TOFUS",
    title: "50% para 10 usos",
    description: "Cupom limitado aos 10 primeiros usos com metade do valor.",
  },
  {
    code: "FOUNDERS",
    title: "R$ 20 vitalício",
    description: "Pagamento único para acesso vitalício dos 10 primeiros fundadores.",
  },
  {
    code: "OGANDALF",
    title: "R$ 2,50/mês",
    description: "Preço especial mensal para os 10 primeiros usos do cupom.",
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
    ACTIVE_COUPON_PREVIEWS.find((coupon) => coupon.code === normalizedCode) ?? null
  );
}

export function isSuperAdminEmail(email?: string | null) {
  return SUPERADMIN_EMAILS.includes((email ?? "").trim().toLowerCase());
}

function mapReferralSummary(row: {
  code: string;
  qualified_referrals: number;
  credits_earned: number;
  credits_used: number;
  credits_available: number;
  available_cents: number;
  next_credit_progress: number;
}): ReferralSummary {
  return {
    code: row.code,
    qualifiedReferrals: row.qualified_referrals,
    creditsEarned: row.credits_earned,
    creditsUsed: row.credits_used,
    creditsAvailable: row.credits_available,
    availableCents: row.available_cents,
    nextCreditProgress: row.next_credit_progress,
  };
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
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [referralSummary, setReferralSummary] =
    useState<ReferralSummary | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);
  const isSuperAdmin = isSuperAdminEmail(user?.email);

  async function reloadReferralSummary() {
    if (!user || guestMode) {
      setReferralSummary(null);
      setReferralLoading(false);
      setReferralError(null);
      return;
    }

    setReferralLoading(true);
    setReferralError(null);

    const { data, error } = await supabase
      .rpc("get_my_referral_summary")
      .maybeSingle();

    if (error) {
      console.warn("Resumo de convites ainda não está configurado:", error);
      setReferralSummary(null);
      setReferralError("Convites ainda não estão configurados.");
      setReferralLoading(false);
      return;
    }

    setReferralSummary(
      data ? mapReferralSummary(data as Parameters<typeof mapReferralSummary>[0]) : null
    );
    setReferralLoading(false);
  }

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
      setReferralSummary(null);
      setReferralLoading(false);
      setReferralError(null);
      return;
    }

    loadSubscription(user.id);
    reloadReferralSummary();

    return () => {
      cancelled = true;
    };
  }, [guestMode, progressLoaded, user]);

  async function startCheckout(
    couponCode = "",
    paymentMode: CheckoutPaymentMode = "card",
    useReferralCredits = false
  ) {
    if (!user || guestMode) return;

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        throw new Error("Sessão expirada. Entre novamente para assinar.");
      }

      const response = await fetch("/api/billing/mercadopago/checkout", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          couponCode: couponCode.trim().toUpperCase(),
          paymentMode,
          useReferralCredits,
        }),
      });

      const checkout = (await response.json()) as {
        error?: string;
        initPoint?: string;
      };

      if (!response.ok || !checkout.initPoint) {
        throw new Error(checkout.error ?? "Não foi possível abrir o checkout.");
      }

      window.location.href = checkout.initPoint;
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Não foi possível abrir o checkout."
      );
      setCheckoutLoading(false);
    }
  }

  return useMemo(() => {
    if (guestMode) {
      return {
        accessStatus: "guest",
        isSuperAdmin: false,
        canUsePremiumFeatures: true,
        canUseCloudSync: false,
        loading: false,
        setupPending: false,
        subscription: null,
        trialDaysRemaining: null,
        trialEndsAt: null,
        planLabel: "Visitante",
        priceLabel: formatCurrencyCents(PREMIUM_PRICE_CENTS),
        referralSummary: null,
        referralLoading: false,
        referralError: null,
        checkoutLoading,
        checkoutError,
        startCheckout,
        reloadReferralSummary,
      };
    }

    if (loading) {
      return {
        accessStatus: "loading",
        isSuperAdmin,
        canUsePremiumFeatures: true,
        canUseCloudSync: true,
        loading,
        setupPending,
        subscription,
        trialDaysRemaining: null,
        trialEndsAt: null,
        planLabel: "Carregando plano",
        priceLabel: formatCurrencyCents(PREMIUM_PRICE_CENTS),
        referralSummary,
        referralLoading,
        referralError,
        checkoutLoading,
        checkoutError,
        startCheckout,
        reloadReferralSummary,
      };
    }

    const accessStatus = setupPending
      ? "setup_pending"
      : resolveAccessStatus(subscription);
    const effectiveAccessStatus = isSuperAdmin ? "active" : accessStatus;
    const hasAccess =
      isSuperAdmin ||
      effectiveAccessStatus === "trialing" ||
      effectiveAccessStatus === "active" ||
      effectiveAccessStatus === "setup_pending";

    return {
      accessStatus: effectiveAccessStatus,
      isSuperAdmin,
      canUsePremiumFeatures: hasAccess,
      canUseCloudSync: hasAccess,
      loading,
      setupPending,
      subscription,
      trialDaysRemaining: daysUntil(subscription?.trial_ends_at ?? null),
      trialEndsAt: subscription?.trial_ends_at ?? null,
      planLabel: isSuperAdmin
        ? "Superadmin"
        : effectiveAccessStatus === "active"
          ? "Premium"
          : "Teste grátis",
      priceLabel: formatCurrencyCents(PREMIUM_PRICE_CENTS),
      referralSummary,
      referralLoading,
      referralError,
      checkoutLoading,
      checkoutError,
      startCheckout,
      reloadReferralSummary,
    };
  }, [
    guestMode,
    loading,
    setupPending,
    subscription,
    referralSummary,
    referralLoading,
    referralError,
    checkoutLoading,
    checkoutError,
    user,
  ]);
}
