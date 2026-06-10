import {
  findUserByEmail,
  jsonError,
  LIFETIME_PRICE_CENTS,
  recordPaymentEvent,
  securityHeaders,
  upsertActiveSubscription,
  verifyMercadoPagoWebhookSignature,
  type BillingEnv,
  type MercadoPagoPaymentResponse,
} from "../../../_shared/billing";

export const onRequestPost: PagesFunction<BillingEnv> = async ({
  env,
  request,
}) => {
  const accessToken = env.MERCADO_PAGO_ACCESS_TOKEN;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const webhookSecret = env.MERCADO_PAGO_WEBHOOK_SECRET;

  if (!accessToken || !serviceRoleKey || !webhookSecret) {
    return jsonError("Billing webhook is not configured.", 500);
  }

  const url = new URL(request.url);

  if (!(await verifyMercadoPagoWebhookSignature(request, url, webhookSecret))) {
    return jsonError("Invalid Mercado Pago webhook signature.", 401);
  }

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
    return Response.json(
      { ok: true, ignored: true },
      { headers: securityHeaders }
    );
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

  const paymentEmail = payment.payer?.email?.trim() ?? "";
  const paymentUserId = payment.external_reference ?? payment.metadata?.user_id;
  const targetUser = paymentUserId
    ? { id: paymentUserId, email: paymentEmail || null }
    : paymentEmail
      ? await findUserByEmail(paymentEmail, serviceRoleKey)
      : null;
  const userId = targetUser?.id ?? null;
  const referralCreditCents = Number(payment.metadata?.referral_credit_cents ?? 0);
  const amountCents =
    typeof payment.transaction_amount === "number"
      ? Math.round(payment.transaction_amount * 100)
      : null;
  const inferredCouponCode =
    payment.metadata?.coupon_code ??
    (payment.status === "approved" &&
    amountCents === LIFETIME_PRICE_CENTS
      ? "FOUNDERS"
      : null);

  await recordPaymentEvent({
    userId,
    providerPaymentId: String(paymentId),
    eventType: "payment",
    status: payment.status ?? null,
    paymentMode: payment.metadata?.payment_mode ?? payment.payment_type_id ?? null,
    couponCode: inferredCouponCode,
    amountCents,
    rawEvent: {
      id: paymentId,
      status: payment.status,
      status_detail: payment.status_detail,
      payment_method_id: payment.payment_method_id,
      payment_type_id: payment.payment_type_id,
      payer_email: paymentEmail || null,
      metadata: payment.metadata,
      inferred_coupon_code: inferredCouponCode,
      referral_credit_cents: Number.isFinite(referralCreditCents)
        ? referralCreditCents
        : 0,
    },
    serviceRoleKey,
  });

  if (payment.status !== "approved") {
    return Response.json(
      { ok: true, status: payment.status },
      { headers: securityHeaders }
    );
  }

  if (!userId) {
    console.error("Approved Mercado Pago payment without matched user:", {
      paymentId,
      payerEmail: paymentEmail || null,
      metadata: payment.metadata,
      externalReference: payment.external_reference,
    });
    return jsonError("Payment has no matched user.", 422);
  }

  await upsertActiveSubscription({
    userId,
    paymentId: String(paymentId),
    couponCode: inferredCouponCode,
    referralCreditCents: Number.isFinite(referralCreditCents)
      ? referralCreditCents
      : 0,
    serviceRoleKey,
  });

  return Response.json({ ok: true }, { headers: securityHeaders });
};
