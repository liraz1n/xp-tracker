import {
  jsonError,
  upsertActiveSubscription,
  type BillingEnv,
  type MercadoPagoPaymentResponse,
} from "../../../_shared/billing";

export const onRequestPost: PagesFunction<BillingEnv> = async ({
  env,
  request,
}) => {
  const accessToken = env.MERCADO_PAGO_ACCESS_TOKEN;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!accessToken || !serviceRoleKey) {
    return jsonError("Billing webhook is not configured.", 500);
  }

  const url = new URL(request.url);
  const body = (await request.json().catch(() => ({}))) as {
    type?: string;
    topic?: string;
    id?: string | number;
    data?: {
      id?: string | number;
    };
  };
  const eventType = body.type ?? body.topic ?? url.searchParams.get("type");
  const paymentId =
    body.data?.id ??
    body.id ??
    url.searchParams.get("data.id") ??
    url.searchParams.get("id");

  if (eventType !== "payment" || !paymentId) {
    return Response.json({ ok: true, ignored: true });
  }

  const paymentResponse = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const payment = (await paymentResponse.json()) as MercadoPagoPaymentResponse;

  if (!paymentResponse.ok) {
    console.error("Mercado Pago payment lookup error:", payment);
    return jsonError("Could not inspect Mercado Pago payment.", 502);
  }

  if (payment.status !== "approved") {
    return Response.json({ ok: true, status: payment.status });
  }

  const userId = payment.external_reference ?? payment.metadata?.user_id;

  if (!userId) {
    console.error("Approved Mercado Pago payment without user reference:", paymentId);
    return jsonError("Payment has no user reference.", 422);
  }

  await upsertActiveSubscription({
    userId,
    paymentId: String(paymentId),
    serviceRoleKey,
  });

  return Response.json({ ok: true });
};
