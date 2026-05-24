import type { Plan } from "@prisma/client";

/** 计划功能开关 */
export const PLAN_FEATURES = {
  FREE: {
    autoReminders: false,
    analytics: false,
    aiInvoice: false,
    brandingTemplate: false,
    templates: ["STANDARD"] as const,
    aiGenerationsPerMonth: 0,
  },
  PRO: {
    autoReminders: true,
    analytics: true,
    aiInvoice: true,
    brandingTemplate: true,
    templates: ["STANDARD", "MINIMAL", "CORPORATE", "BRANDING"] as const,
    aiGenerationsPerMonth: 50,
  },
  BUSINESS: {
    autoReminders: true,
    analytics: true,
    aiInvoice: true,
    brandingTemplate: true,
    templates: ["STANDARD", "MINIMAL", "CORPORATE", "BRANDING"] as const,
    aiGenerationsPerMonth: 200,
  },
} as const;

export function getPlanFeatures(plan: Plan) {
  return PLAN_FEATURES[plan];
}

export function assertFeature(
  plan: Plan,
  feature: keyof typeof PLAN_FEATURES.FREE
): void {
  const features = getPlanFeatures(plan);
  if (!features[feature]) {
    throw new Error(`FEATURE_REQUIRES_PRO:${feature}`);
  }
}
