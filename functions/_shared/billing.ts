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
  };
};

export const SUPABASE_URL = "https://vshglekspdbjnxngudmc.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_kzsAi2dFuLrMjcr6R06MNw_8Vuv5Ilq";
export const PREMIUM_PRICE = 5.99;
export const PLAN_ID = "premium_monthly";

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
  serviceRoleKey,
}: {
  userId: string;
  paymentId: string;
  serviceRoleKey: string;
}) {
  const now = new Date();
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
        plan: PLAN_ID,
        status: "active",
        provider: "mercado_pago",
        provider_subscription_id: paymentId,
        current_period_started_at: now.toISOString(),
        current_period_ends_at: periodEndsAt.toISOString(),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }
}
