export type BillingEnv = {
  MERCADO_PAGO_ACCESS_TOKEN?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  APP_BASE_URL?: string;
};

export type MercadoPagoPreferenceResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
};

export type MercadoPagoPaymentResponse = {
  status?: string;
  external_reference?: string;
  metadata?: {
    user_id?: string;
    coupon_code?: string;
  };
};

type DiscountCouponRow = {
  id: string;
  code: string;
  discount_type: "percent" | "free_months" | "fixed_price_cents";
  discount_value: number;
  duration_type: "once" | "repeating" | "forever";
  duration_months: number | null;
  max_redemptions: number | null;
  redeemed_count: number;
  expires_at: string | null;
};

export type AppliedCoupon = {
  code: string;
  price: number;
  discountPercent: number | null;
  discountAmountCents: number | null;
  discountEndsAt: string | null;
};

export const SUPABASE_URL = "https://vshglekspdbjnxngudmc.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_kzsAi2dFuLrMjcr6R06MNw_8Vuv5Ilq";
export const PREMIUM_PRICE = 5.99;
export const PREMIUM_PRICE_CENTS = 599;
export const PLAN_ID = "premium_monthly";
const ALLOWED_COUPONS = new Set(["BETA50", "FOUNDERS"]);

export function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function getBaseUrl(request: Request, env: BillingEnv) {
  if (env.APP_BASE_URL) return env.APP_BASE_URL.replace(/\/$/, "");

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function getAuthenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization,
    },
  });

  if (!response.ok) return null;

  return response.json() as Promise<{ id: string; email?: string }>;
}

export async function upsertActiveSubscription({
  userId,
  paymentId,
  couponCode,
  serviceRoleKey,
}: {
  userId: string;
  paymentId: string;
  couponCode?: string | null;
  serviceRoleKey: string;
}) {
  const now = new Date();
  const periodEndsAt = new Date(now);
  periodEndsAt.setDate(periodEndsAt.getDate() + 30);
  const appliedCoupon = await redeemCoupon({
    couponCode,
    userId,
    serviceRoleKey,
  });

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/user_subscriptions?on_conflict=user_id`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        "content-type": "application/json",
        prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        user_id: userId,
        plan: PLAN_ID,
        status: "active",
        provider: "mercado_pago",
        provider_subscription_id: paymentId,
        current_period_started_at: now.toISOString(),
        current_period_ends_at: periodEndsAt.toISOString(),
        coupon_code: appliedCoupon?.code ?? null,
        discount_percent: appliedCoupon?.discountPercent ?? null,
        discount_amount_cents: appliedCoupon?.discountAmountCents ?? null,
        discount_ends_at: appliedCoupon?.discountEndsAt ?? null,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function resolveCouponForCheckout({
  couponCode,
  serviceRoleKey,
}: {
  couponCode?: string | null;
  serviceRoleKey: string;
}): Promise<AppliedCoupon | null> {
  const code = couponCode?.trim().toUpperCase();

  if (!code) return null;

  if (!ALLOWED_COUPONS.has(code)) {
    throw new Error("Cupom inválido ou indisponível.");
  }

  const coupon = await getActiveCoupon(code, serviceRoleKey);
  const maxRedemptions = maxRedemptionsForCoupon(coupon);

  if (!coupon) {
    throw new Error("Cupom inválido ou indisponível.");
  }

  if (
    maxRedemptions !== null &&
    coupon.redeemed_count >= maxRedemptions
  ) {
    throw new Error("Esse cupom já atingiu o limite de uso.");
  }

  return applyCoupon(coupon);
}

async function redeemCoupon({
  couponCode,
  userId,
  serviceRoleKey,
}: {
  couponCode?: string | null;
  userId: string;
  serviceRoleKey: string;
}): Promise<AppliedCoupon | null> {
  const code = couponCode?.trim().toUpperCase();

  if (!code || !ALLOWED_COUPONS.has(code)) return null;

  const coupon = await getActiveCoupon(code, serviceRoleKey);

  if (!coupon) return null;

  const alreadyRedeemed = await userAlreadyRedeemedCoupon({
    couponId: coupon.id,
    userId,
    serviceRoleKey,
  });
  const appliedCoupon = applyCoupon(coupon);

  if (alreadyRedeemed) return appliedCoupon;

  const redemptionResponse = await fetch(`${SUPABASE_URL}/rest/v1/coupon_redemptions`, {
    method: "POST",
    headers: serviceRoleHeaders(serviceRoleKey),
    body: JSON.stringify({
      coupon_id: coupon.id,
      user_id: userId,
    }),
  });

  if (!redemptionResponse.ok) {
    if (redemptionResponse.status === 409) return appliedCoupon;

    throw new Error(await redemptionResponse.text());
  }

  const redeemedCount = coupon.redeemed_count + 1;
  const maxRedemptions = maxRedemptionsForCoupon(coupon);

  const couponResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/discount_coupons?id=eq.${coupon.id}`,
    {
      method: "PATCH",
      headers: serviceRoleHeaders(serviceRoleKey),
      body: JSON.stringify({
        redeemed_count: redeemedCount,
        active:
          maxRedemptions === null ||
          redeemedCount < maxRedemptions,
      }),
    }
  );

  if (!couponResponse.ok) {
    throw new Error(await couponResponse.text());
  }

  return appliedCoupon;
}

async function getActiveCoupon(code: string, serviceRoleKey: string) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/discount_coupons?code=eq.${encodeURIComponent(
      code
    )}&active=eq.true&select=id,code,discount_type,discount_value,duration_type,duration_months,max_redemptions,redeemed_count,expires_at&limit=1`,
    {
      headers: serviceRoleHeaders(serviceRoleKey),
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const [coupon] = (await response.json()) as DiscountCouponRow[];

  if (!coupon) return null;

  if (coupon.expires_at && new Date(coupon.expires_at).getTime() <= Date.now()) {
    return null;
  }

  return coupon;
}

async function userAlreadyRedeemedCoupon({
  couponId,
  userId,
  serviceRoleKey,
}: {
  couponId: string;
  userId: string;
  serviceRoleKey: string;
}) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/coupon_redemptions?coupon_id=eq.${couponId}&user_id=eq.${userId}&select=id&limit=1`,
    {
      headers: serviceRoleHeaders(serviceRoleKey),
    }
  );

  if (!response.ok) return false;

  const rows = (await response.json()) as { id: string }[];

  return rows.length > 0;
}

function applyCoupon(coupon: DiscountCouponRow): AppliedCoupon {
  if (coupon.discount_type === "percent") {
    const discountPercent = Number(coupon.discount_value);
    const priceCents = Math.round(
      PREMIUM_PRICE_CENTS * (1 - discountPercent / 100)
    );

    return {
      code: coupon.code,
      price: Math.max(0.01, priceCents / 100),
      discountPercent,
      discountAmountCents: null,
      discountEndsAt: couponEndsAt(coupon),
    };
  }

  if (coupon.discount_type === "fixed_price_cents") {
    const fixedPriceCents = Number(coupon.discount_value);

    return {
      code: coupon.code,
      price: Math.max(0.01, fixedPriceCents / 100),
      discountPercent: null,
      discountAmountCents: Math.max(0, PREMIUM_PRICE_CENTS - fixedPriceCents),
      discountEndsAt: couponEndsAt(coupon),
    };
  }

  return {
    code: coupon.code,
    price: PREMIUM_PRICE,
    discountPercent: null,
    discountAmountCents: null,
    discountEndsAt: couponEndsAt(coupon),
  };
}

function couponEndsAt(coupon: DiscountCouponRow) {
  if (coupon.duration_type !== "repeating" || !coupon.duration_months) {
    return null;
  }

  const date = new Date();
  date.setMonth(date.getMonth() + coupon.duration_months);

  return date.toISOString();
}

function maxRedemptionsForCoupon(coupon: DiscountCouponRow | null) {
  if (coupon?.code === "FOUNDERS") return 10;

  return coupon?.max_redemptions ?? null;
}

function serviceRoleHeaders(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
  };
}
