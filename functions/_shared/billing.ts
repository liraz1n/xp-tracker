export type BillingEnv = {
  MERCADO_PAGO_ACCESS_TOKEN?: string;
  MERCADO_PAGO_WEBHOOK_SECRET?: string;
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
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  payment_method_id?: string;
  payment_type_id?: string;
  payer?: {
    email?: string;
  };
  metadata?: {
    user_id?: string;
    coupon_code?: string;
    payment_mode?: string;
    referral_credit_cents?: string | number;
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
export const LIFETIME_PRICE_CENTS = 2000;
export const PLAN_ID = "premium_monthly";
export const LIFETIME_PLAN_ID = "premium_lifetime";
const ALLOWED_COUPONS = new Set(["BETA50", "TOFUS", "FOUNDERS", "OGANDALF"]);

export const securityHeaders = {
  "cache-control": "no-store",
  "content-security-policy":
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
};

export function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json", ...securityHeaders },
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

export async function verifyMercadoPagoWebhookSignature(
  request: Request,
  url: URL,
  webhookSecret: string
) {
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  if (!xSignature || !xRequestId || !dataId) return false;

  const signatureParts = Object.fromEntries(
    xSignature.split(",").map((part) => {
      const [key, ...value] = part.split("=");
      return [key.trim(), value.join("=").trim()];
    })
  );
  const timestamp = signatureParts.ts;
  const signature = signatureParts.v1;

  if (!timestamp || !signature) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${timestamp};`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(manifest)
  );
  const expectedSignature = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqual(expectedSignature, signature);
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;

  let mismatch = 0;

  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}

export async function upsertActiveSubscription({
  userId,
  paymentId,
  couponCode,
  referralCreditCents,
  serviceRoleKey,
}: {
  userId: string;
  paymentId: string;
  couponCode?: string | null;
  referralCreditCents?: number | null;
  serviceRoleKey: string;
}) {
  const now = new Date();
  const appliedCoupon = await redeemCoupon({
    couponCode,
    userId,
    serviceRoleKey,
  });
  const lifetimeAccess = appliedCoupon?.code === "FOUNDERS";
  const periodEndsAt = new Date(now);
  periodEndsAt.setDate(periodEndsAt.getDate() + 30);

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
        plan: lifetimeAccess ? LIFETIME_PLAN_ID : PLAN_ID,
        status: "active",
        provider: "mercado_pago",
        provider_subscription_id: paymentId,
        current_period_started_at: now.toISOString(),
        current_period_ends_at: lifetimeAccess ? null : periodEndsAt.toISOString(),
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

  if (referralCreditCents && referralCreditCents > 0) {
    await recordReferralCreditUsage({
      userId,
      paymentId,
      amountCents: referralCreditCents,
      serviceRoleKey,
    });
  }
}

export async function recordPaymentEvent({
  userId,
  providerPaymentId,
  eventType,
  status,
  paymentMode,
  couponCode,
  amountCents,
  rawEvent,
  serviceRoleKey,
}: {
  userId?: string | null;
  providerPaymentId?: string | null;
  eventType: string;
  status?: string | null;
  paymentMode?: string | null;
  couponCode?: string | null;
  amountCents?: number | null;
  rawEvent?: unknown;
  serviceRoleKey: string;
}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/payment_events`, {
    method: "POST",
    headers: serviceRoleHeaders(serviceRoleKey),
    body: JSON.stringify({
      user_id: userId ?? null,
      provider: "mercado_pago",
      provider_payment_id: providerPaymentId ?? null,
      event_type: eventType,
      status: status ?? null,
      payment_mode: paymentMode ?? null,
      coupon_code: couponCode ?? null,
      amount_cents: amountCents ?? null,
      raw_event: rawEvent ?? {},
    }),
  });

  if (!response.ok) {
    console.error("Could not record payment event:", await response.text());
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

export async function getAvailableReferralCreditCents({
  userId,
  serviceRoleKey,
}: {
  userId: string;
  serviceRoleKey: string;
}) {
  const referralsResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/referrals?referrer_user_id=eq.${userId}&status=eq.qualified&select=id`,
    {
      headers: serviceRoleHeaders(serviceRoleKey),
    }
  );

  if (!referralsResponse.ok) return 0;

  const referrals = (await referralsResponse.json()) as { id: string }[];
  const earnedCents = Math.floor(referrals.length / 5) * 50;

  const transactionsResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/referral_credit_transactions?user_id=eq.${userId}&transaction_type=eq.checkout_discount&select=amount_cents`,
    {
      headers: serviceRoleHeaders(serviceRoleKey),
    }
  );

  if (!transactionsResponse.ok) return earnedCents;

  const transactions = (await transactionsResponse.json()) as {
    amount_cents: number;
  }[];
  const usedCents = transactions.reduce(
    (sum, transaction) => sum + Math.abs(Math.min(0, transaction.amount_cents)),
    0
  );

  return Math.max(0, earnedCents - usedCents);
}

async function recordReferralCreditUsage({
  userId,
  paymentId,
  amountCents,
  serviceRoleKey,
}: {
  userId: string;
  paymentId: string;
  amountCents: number;
  serviceRoleKey: string;
}) {
  const existingResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/referral_credit_transactions?user_id=eq.${userId}&transaction_type=eq.checkout_discount&reference_id=eq.${encodeURIComponent(
      paymentId
    )}&select=id&limit=1`,
    {
      headers: serviceRoleHeaders(serviceRoleKey),
    }
  );

  if (existingResponse.ok) {
    const existing = (await existingResponse.json()) as { id: string }[];

    if (existing.length > 0) return;
  }

  const availableCents = await getAvailableReferralCreditCents({
    userId,
    serviceRoleKey,
  });
  const usageCents = Math.min(amountCents, availableCents);

  if (usageCents <= 0) return;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/referral_credit_transactions`,
    {
      method: "POST",
      headers: serviceRoleHeaders(serviceRoleKey),
      body: JSON.stringify({
        user_id: userId,
        amount_cents: -usageCents,
        transaction_type: "checkout_discount",
        reference_id: paymentId,
        metadata: {
          provider: "mercado_pago",
        },
      }),
    }
  );

  if (!response.ok) {
    console.error("Could not record referral credit usage:", await response.text());
  }
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
  if (coupon.code === "FOUNDERS") {
    return {
      code: coupon.code,
      price: LIFETIME_PRICE_CENTS / 100,
      discountPercent: null,
      discountAmountCents: null,
      discountEndsAt: null,
    };
  }

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
  if (coupon?.code === "OGANDALF") return 10;
  if (coupon?.code === "TOFUS") return 10;

  return coupon?.max_redemptions ?? null;
}

function serviceRoleHeaders(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
  };
}
