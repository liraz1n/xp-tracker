import { Hono } from "hono";
import { createRequestHandler } from "react-router";

type Env = {
	MERCADO_PAGO_ACCESS_TOKEN?: string;
	SUPABASE_SERVICE_ROLE_KEY?: string;
	APP_BASE_URL?: string;
};

type MercadoPagoPreferenceResponse = {
	id?: string;
	init_point?: string;
	sandbox_init_point?: string;
};

type MercadoPagoPaymentResponse = {
	status?: string;
	external_reference?: string;
	metadata?: {
		user_id?: string;
	};
};

const SUPABASE_URL = "https://vshglekspdbjnxngudmc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_kzsAi2dFuLrMjcr6R06MNw_8Vuv5Ilq";
const PREMIUM_PRICE = 5;
const PLAN_ID = "premium_monthly";

const app = new Hono<{ Bindings: Env }>();

function jsonError(message: string, status = 400) {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: { "content-type": "application/json" },
	});
}

function getBaseUrl(request: Request, env: Env) {
	if (env.APP_BASE_URL) return env.APP_BASE_URL.replace(/\/$/, "");

	const url = new URL(request.url);
	return `${url.protocol}//${url.host}`;
}

async function getAuthenticatedUser(request: Request) {
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

async function upsertActiveSubscription({
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
		},
	);

	if (!response.ok) {
		throw new Error(await response.text());
	}
}

app.post("/api/billing/mercadopago/checkout", async (c) => {
	const accessToken = c.env.MERCADO_PAGO_ACCESS_TOKEN;

	if (!accessToken) {
		return jsonError("Mercado Pago access token is not configured.", 500);
	}

	const user = await getAuthenticatedUser(c.req.raw);

	if (!user) {
		return jsonError("Unauthorized.", 401);
	}

	const baseUrl = getBaseUrl(c.req.raw, c.env);

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
		},
	);

	const preference =
		(await preferenceResponse.json()) as MercadoPagoPreferenceResponse;

	if (!preferenceResponse.ok) {
		console.error("Mercado Pago preference error:", preference);
		return jsonError("Could not create Mercado Pago checkout.", 502);
	}

	return c.json({
		id: preference.id,
		initPoint: preference.init_point,
		sandboxInitPoint: preference.sandbox_init_point,
	});
});

app.post("/api/billing/mercadopago/webhook", async (c) => {
	const accessToken = c.env.MERCADO_PAGO_ACCESS_TOKEN;
	const serviceRoleKey = c.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!accessToken || !serviceRoleKey) {
		return jsonError("Billing webhook is not configured.", 500);
	}

	const url = new URL(c.req.url);
	const body = await c.req.json().catch(() => ({}));
	const eventType = body.type ?? body.topic ?? url.searchParams.get("type");
	const paymentId =
		body.data?.id ?? body.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id");

	if (eventType !== "payment" || !paymentId) {
		return c.json({ ok: true, ignored: true });
	}

	const paymentResponse = await fetch(
		`https://api.mercadopago.com/v1/payments/${paymentId}`,
		{
			headers: {
				authorization: `Bearer ${accessToken}`,
			},
		},
	);

	const payment = (await paymentResponse.json()) as MercadoPagoPaymentResponse;

	if (!paymentResponse.ok) {
		console.error("Mercado Pago payment lookup error:", payment);
		return jsonError("Could not inspect Mercado Pago payment.", 502);
	}

	if (payment.status !== "approved") {
		return c.json({ ok: true, status: payment.status });
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

	return c.json({ ok: true });
});

app.get("*", (c) => {
	const requestHandler = createRequestHandler(
		() => import("virtual:react-router/server-build"),
		import.meta.env.MODE,
	);

	return requestHandler(c.req.raw, {
		cloudflare: { env: c.env, ctx: c.executionCtx },
	});
});

export default app;
