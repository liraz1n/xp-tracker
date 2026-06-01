import {
  getAuthenticatedUser,
  getBaseUrl,
  jsonError,
  PLAN_ID,
  PREMIUM_PRICE,
  resolveCouponForCheckout,
  type BillingEnv,
  type MercadoPagoPreferenceResponse,
} from "../../../_shared/billing";

export const onRequestPost: PagesFunction<BillingEnv> = async ({
  env,
  request,
}) => {
  const accessToken = env.MERCADO_PAGO_ACCESS_TOKEN;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!accessToken) {
    return jsonError("Mercado Pago access token is not configured.", 500);
  }

  const user = await getAuthenticatedUser(request);

  if (!user) {
    return jsonError("Unauthorized.", 401);
  }

  const baseUrl = getBaseUrl(request, env);
  const body = (await request.json().catch(() => ({}))) as {
    couponCode?: string;
    paymentMode?: "card" | "pix";
  };
  let finalPrice = PREMIUM_PRICE;
  let couponCode: string | null = null;
  const paymentMode = body.paymentMode === "pix" ? "pix" : "card";
  const paymentMethods =
    paymentMode === "pix"
      ? {
          excluded_payment_types: [
            { id: "credit_card" },
            { id: "debit_card" },
            { id: "ticket" },
            { id: "atm" },
          ],
          installments: 1,
        }
      : {
          excluded_payment_types: [
            { id: "bank_transfer" },
            { id: "ticket" },
            { id: "atm" },
          ],
          installments: 1,
        };

  if (body.couponCode?.trim()) {
    if (!serviceRoleKey) {
      return jsonError("Coupon validation is not configured.", 500);
    }

    try {
      const coupon = await resolveCouponForCheckout({
        couponCode: body.couponCode,
        serviceRoleKey,
      });

      if (coupon) {
        finalPrice = coupon.price;
        couponCode = coupon.code;
      }
    } catch (error) {
      return jsonError(
        error instanceof Error ? error.message : "Cupom indisponível.",
        422
      );
    }
  }

  const preferenceResponse = await fetch(
    "https://api.mercadopago.com/checkout/preferences",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            id: PLAN_ID,
            title: "XP Tracker Premium",
            description: "Acesso Premium mensal ao XP Tracker",
            quantity: 1,
            currency_id: "BRL",
            unit_price: finalPrice,
          },
        ],
        payer: {
          email: user.email,
        },
        external_reference: user.id,
        metadata: {
          user_id: user.id,
          plan: PLAN_ID,
          coupon_code: couponCode,
          payment_mode: paymentMode,
        },
        payment_methods: paymentMethods,
        back_urls: {
          success: `${baseUrl}/?payment=success`,
          failure: `${baseUrl}/?payment=failure`,
          pending: `${baseUrl}/?payment=pending`,
        },
        auto_return: "approved",
        notification_url: `${baseUrl}/api/billing/mercadopago/webhook`,
      }),
    }
  );

  const preference =
    (await preferenceResponse.json()) as MercadoPagoPreferenceResponse;

  if (!preferenceResponse.ok) {
    console.error("Mercado Pago preference error:", preference);
    return jsonError("Could not create Mercado Pago checkout.", 502);
  }

  return Response.json({
    id: preference.id,
    initPoint: preference.init_point,
    sandboxInitPoint: preference.sandbox_init_point,
  });
};
