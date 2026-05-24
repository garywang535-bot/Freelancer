import type { InvoiceTemplate, Plan } from "@prisma/client";
import { getPlanFeatures } from "@/lib/billing/features";

/** 校验用户是否可使用指定模板 */
export function assertTemplateAllowed(plan: Plan, template: InvoiceTemplate): void {
  const features = getPlanFeatures(plan);
  const allowed = features.templates as readonly string[];
  if (!allowed.includes(template)) {
    throw new Error("TEMPLATE_REQUIRES_PRO");
  }
}

/** 获取用户可用模板列表 */
export function getAllowedTemplates(plan: Plan): InvoiceTemplate[] {
  return [...getPlanFeatures(plan).templates] as InvoiceTemplate[];
}
