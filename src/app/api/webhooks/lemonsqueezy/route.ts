import { NextRequest } from "next/server";
import {
  handleLemonSqueezyWebhook,
  verifyLemonSqueezyWebhook,
} from "@/lib/services/billing.service";

export const runtime = "nodejs";

/** Lemon Squeezy Webhook（订阅状态同步） */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("Lemon Squeezy webhook not configured", { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyLemonSqueezyWebhook(rawBody, signature)) {
    console.error("[lemonsqueezy webhook] invalid signature");
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    await handleLemonSqueezyWebhook(payload);
  } catch (error) {
    console.error("[lemonsqueezy webhook] handler error:", error);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
