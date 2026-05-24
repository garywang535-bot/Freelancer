import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { syncSubscriptionForUser } from "@/lib/services/billing.service";

/** 支付成功后同步 Lemon Squeezy 订阅 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return fail("未登录", 401, "UNAUTHORIZED");

  let checkoutId: string | undefined;
  try {
    const body = await request.json();
    if (typeof body?.checkoutId === "string" && body.checkoutId.length > 0) {
      checkoutId = body.checkoutId;
    }
  } catch {
    // 无 body 时走默认同步逻辑
  }

  try {
    const status = await syncSubscriptionForUser(user.id, checkoutId);
    return ok(status);
  } catch (error) {
    if (error instanceof Error && error.message === "LEMONSQUEEZY_NOT_CONFIGURED") {
      return fail("Lemon Squeezy 未配置", 503, "LEMONSQUEEZY_NOT_CONFIGURED");
    }
    console.error("[billing sync]", error);
    return fail("同步订阅失败", 500);
  }
}
