import {
  getAuthenticatedUser,
  jsonError,
  LIFETIME_PRICE_CENTS,
  recordPaymentEvent,
  securityHeaders,
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
    return jsonError("Billing reconciliation is not configured.", 500);
  }

  const user = await getAuthenticatedUser(request);

  if (!user) {
    return jsonError("Unauthorized.", 401);
  }

  const body = (await request.json().catch(() => ({}))) as {
    paymentId?: string | number | null;
  };
  const paymentId = body.paymentId ? String(body.paymentId) : "";

  if (!paymentId) {
    return jsonError("Payment id is required.", 400);
  }

  const paymentResponse = await fetch(
    `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const payment = (await paymentResponse.json()) as MercadoPagoPaymentResponse;

  if (!paymentResponse.ok) {
    console.error("Mercado Pago reconcile lookup error:", payment);
    return jsonError("Could not inspect Mercado Pago payment.", 502);
  }

  const paymentUserId = payment.external_reference ?? payment.metadata?.user_id;
  const paymentEmail = payment.payer?.email?.trim().toLowerCase() ?? "";
  const currentUserEmail = user.email?.trim().toLowerCase() ?? "";

  if (paymentUserId && paymentUserId !== user.id) {
    return jsonError("Payment does not belong to the current user.", 403);
  }

  if (!paymentUserId && (!paymentEmail || paymentEmail !== currentUserEmail)) {
    return jsonError("Payment does not belong to the current user.", 403);
  }

  const referralCreditCents = Number(payment.metadata?.referral_credit_cents ?? 0);
  const amountCents =
    typeof payment.transaction_amount === "number"
      ? Math.round(payment.transaction_amount * 100)
      : null;
  const inferredCouponCode =
    payment.metadata?.coupon_code ??
    (payment.status === "approved" && amountCents === LIFETIME_PRICE_CENTS
      ? "FOUNDERS"
      : null);

  await recordPaymentEvent({
    userId: user.id,
    providerPaymentId: paymentId,
    eventType: "payment_reconcile",
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
      payer_email: payment.payer?.email ?? null,
      metadata: payment.metadata,
      inferred_coupon_code: inferredCouponCode,
      source: "return_reconciliation",
      referral_credit_cents: Number.isFinite(referralCreditCents)
        ? referralCreditCents
        : 0,
    },
    serviceRoleKey,
  });

  if (payment.status === "approved") {
    await upsertActiveSubscription({
      userId: user.id,
      paymentId,
      couponCode: inferredCouponCode,
      referralCreditCents: Number.isFinite(referralCreditCents)
        ? referralCreditCents
        : 0,
      serviceRoleKey,
    });
  }

  return Response.json(
    {
      ok: true,
      status: payment.status,
      couponCode: inferredCouponCode,
      amountCents,
    },
    { headers: securityHeaders }
  );
};
