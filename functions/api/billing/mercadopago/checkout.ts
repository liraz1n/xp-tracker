import {
  getAuthenticatedUser,
  getBaseUrl,
  jsonError,
  PLAN_ID,
  PREMIUM_PRICE,
  type BillingEnv,
  type MercadoPagoPreferenceResponse,
} from "../../../_shared/billing";

export const onRequestPost: PagesFunction<BillingEnv> = async ({
  env,
  request,
}) => {
  const accessToken = env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    return jsonError("Mercado Pago access token is not configured.", 500);
  }

  const user = await getAuthenticatedUser(request);

  if (!user) {
    return jsonError("Unauthorized.", 401);
  }

  const baseUrl = getBaseUrl(request, env);

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
            unit_price: PREMIUM_PRICE,
          },
        ],
        payer: {
          email: user.email,
        },
        external_reference: user.id,
        metadata: {
          user_id: user.id,
          plan: PLAN_ID,
        },
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
