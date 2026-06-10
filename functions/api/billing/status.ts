import {
  getAuthenticatedUser,
  jsonError,
  securityHeaders,
  serviceRoleHeaders,
  SUPABASE_URL,
  type BillingEnv,
} from "../../_shared/billing";

type SubscriptionRow = {
  status: string;
  plan: string;
  trial_ends_at: string | null;
  current_period_ends_at: string | null;
  coupon_code: string | null;
  discount_percent: number | null;
  discount_amount_cents: number | null;
  discount_ends_at: string | null;
};

export const onRequestGet: PagesFunction<BillingEnv> = async ({
  env,
  request,
}) => {
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return jsonError("Billing status is not configured.", 500);
  }

  const user = await getAuthenticatedUser(request);

  if (!user) {
    return jsonError("Unauthorized.", 401);
  }

  const query = new URLSearchParams({
    select:
      "status,plan,trial_ends_at,current_period_ends_at,coupon_code,discount_percent,discount_amount_cents,discount_ends_at",
    user_id: `eq.${user.id}`,
    limit: "1",
  });

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/user_subscriptions?${query.toString()}`,
    {
      headers: serviceRoleHeaders(serviceRoleKey),
    }
  );

  if (!response.ok) {
    console.error("Subscription status lookup failed:", await response.text());
    return jsonError("Could not load billing status.", 502);
  }

  const rows = (await response.json()) as SubscriptionRow[];

  return Response.json(
    {
      ok: true,
      subscription: rows[0] ?? null,
    },
    { headers: securityHeaders }
  );
};
