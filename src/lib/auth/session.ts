import { auth } from "../../../auth";

/** 获取已登录会话，未登录返回 null */
export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}
