import { getSessionUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { createPortalSession } from "@/lib/services/billing.service";

/** 跳转 Lemon Squeezy 客户订阅管理页 */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return fail("未登录", 401, "UNAUTHORIZED");

  try {
    const session = await createPortalSession(user.id);
    return ok(session);
  } catch (error) {
    if (error instanceof Error) {
      const map: Record<string, [string, number, string]> = {
        LEMONSQUEEZY_NOT_CONFIGURED: ["Lemon Squeezy 未配置", 503, "LEMONSQUEEZY_NOT_CONFIGURED"],
        NO_LEMONSQUEEZY_SUBSCRIPTION: [
          "尚未订阅，请先升级计划",
          400,
          "NO_LEMONSQUEEZY_SUBSCRIPTION",
        ],
        PORTAL_URL_UNAVAILABLE: ["无法获取订阅管理链接", 503, "PORTAL_URL_UNAVAILABLE"],
      };
      const mapped = map[error.message];
      if (mapped) return fail(mapped[0], mapped[1], mapped[2]);
    }
    console.error("[billing portal]", error);
    return fail("打开订阅管理失败", 500);
  }
}
