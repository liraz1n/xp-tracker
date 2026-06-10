import {
  findUserByEmail,
  getAuthenticatedUser,
  jsonError,
  LIFETIME_PRICE_CENTS,
  recordPaymentEvent,
  securityHeaders,
  upsertActiveSubscription,
  type BillingEnv,
  type MercadoPagoPaymentResponse,
} from "../../../_shared/billing";

type AdminReconcilePayment = {
  paymentId?: string | number | null;
  email?: string | null;
};

function isSuperAdminEmail(email?: string | null) {
  return (email ?? "").trim().toLowerCase() === "ewertonpro11@gmail.com";
}

export const onRequestPost: PagesFunction<BillingEnv> = async ({
  env,
  request,
}) => {
  const accessToken = env.MERCADO_PAGO_ACCESS_TOKEN;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!accessToken || !serviceRoleKey) {
    return jsonError("Admin payment reconciliation is not configured.", 500);
  }

  const adminUser = await getAuthenticatedUser(request);

  if (!isSuperAdminEmail(adminUser?.email)) {
    return jsonError("Forbidden.", 403);
  }

  const body = (await request.json().catch(() => ({}))) as {
    payments?: AdminReconcilePayment[];
  };
  const payments = (body.payments ?? [])
    .map((payment) => ({
      paymentId: payment.paymentId ? String(payment.paymentId).trim() : "",
      email: payment.email?.trim() ?? "",
    }))
    .filter((payment) => payment.paymentId);

  if (payments.length === 0) {
    return jsonError("At least one payment id is required.", 400);
  }

  const results = [];

  for (const entry of payments) {
    try {
      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${encodeURIComponent(
          entry.paymentId
        )}`,
        {
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const payment = (await paymentResponse.json()) as MercadoPagoPaymentResponse;

      if (!paymentResponse.ok) {
        results.push({
          paymentId: entry.paymentId,
          ok: false,
          error: "Could not inspect Mercado Pago payment.",
        });
        continue;
      }

      const amountCents =
        typeof payment.transaction_amount === "number"
          ? Math.round(payment.transaction_amount * 100)
          : null;
      const inferredCouponCode =
        payment.metadata?.coupon_code ??
        (payment.status === "approved" && amountCents === LIFETIME_PRICE_CENTS
          ? "FOUNDERS"
          : null);
      const paymentEmail = entry.email || payment.payer?.email || "";
      const paymentUserId = payment.external_reference ?? payment.metadata?.user_id;
      const targetUser = paymentUserId
        ? { id: paymentUserId, email: paymentEmail || null }
        : paymentEmail
          ? await findUserByEmail(paymentEmail, serviceRoleKey)
          : null;
      const referralCreditCents = Number(payment.metadata?.referral_credit_cents ?? 0);

      if (!targetUser?.id) {
        results.push({
          paymentId: entry.paymentId,
          ok: false,
          status: payment.status,
          amountCents,
          email: paymentEmail || null,
          error: "No Supabase user found for this payment.",
        });
        continue;
      }

      await recordPaymentEvent({
        userId: targetUser.id,
        providerPaymentId: entry.paymentId,
        eventType: "payment_admin_reconcile",
        status: payment.status ?? null,
        paymentMode: payment.metadata?.payment_mode ?? payment.payment_type_id ?? null,
        couponCode: inferredCouponCode,
        amountCents,
        rawEvent: {
          id: entry.paymentId,
          status: payment.status,
          status_detail: payment.status_detail,
          payment_method_id: payment.payment_method_id,
          payment_type_id: payment.payment_type_id,
          payer_email: paymentEmail || null,
          metadata: payment.metadata,
          inferred_coupon_code: inferredCouponCode,
          source: "admin_reconciliation",
        },
        serviceRoleKey,
      });

      if (payment.status === "approved") {
        await upsertActiveSubscription({
          userId: targetUser.id,
          paymentId: entry.paymentId,
          couponCode: inferredCouponCode,
          referralCreditCents: Number.isFinite(referralCreditCents)
            ? referralCreditCents
            : 0,
          serviceRoleKey,
        });
      }

      results.push({
        paymentId: entry.paymentId,
        ok: true,
        status: payment.status,
        amountCents,
        couponCode: inferredCouponCode,
        email: targetUser.email ?? paymentEmail ?? null,
        userId: targetUser.id,
      });
    } catch (error) {
      results.push({
        paymentId: entry.paymentId,
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected error.",
      });
    }
  }

  return Response.json({ ok: true, results }, { headers: securityHeaders });
};
