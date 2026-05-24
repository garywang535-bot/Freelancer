import OpenAI from "openai";
import { prisma } from "@/lib/db";
import { getUserPlan } from "@/lib/billing/plan-limits";
import { getPlanFeatures } from "@/lib/billing/features";

let openai: OpenAI | null = null;

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      // 国内或受限网络可通过 OPENAI_BASE_URL 指向兼容 OpenAI 的代理/中转
      baseURL: process.env.OPENAI_BASE_URL || undefined,
      timeout: 60_000,
    });
  }
  return openai;
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** 统计当月 AI 使用次数 */
async function countAiThisMonth(userId: string): Promise<number> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  return prisma.aiGenerationLog.count({
    where: { userId, createdAt: { gte: monthStart } },
  });
}

export type AiInvoiceResult = {
  clientHint: string;
  currency: string;
  taxRatePercent: number;
  dueInDays: number;
  paymentTerms: string;
  notes: string;
  items: Array<{ description: string; quantity: number; unitPrice: number }>;
};

const SYSTEM_PROMPT = `You are an invoice assistant for freelancers. Given a natural language description, output JSON only with this schema:
{
  "clientHint": "company or client name mentioned",
  "currency": "USD|EUR|GBP|AUD|CAD|SGD|JPY|HKD|CNY",
  "taxRatePercent": 0,
  "dueInDays": 30,
  "paymentTerms": "Net 30",
  "notes": "optional notes",
  "items": [{ "description": "service", "quantity": 1, "unitPrice": 1000 }]
}`;

/** AI 生成 Invoice 结构化数据 */
export async function generateInvoiceFromPrompt(userId: string, prompt: string) {
  const plan = await getUserPlan(userId);
  const features = getPlanFeatures(plan);

  if (!features.aiInvoice) {
    throw new Error("FEATURE_REQUIRES_PRO:aiInvoice");
  }

  const used = await countAiThisMonth(userId);
  if (used >= features.aiGenerationsPerMonth) {
    throw new Error("AI_LIMIT_REACHED");
  }

  const client = getOpenAI();
  if (!client) throw new Error("AI_NOT_CONFIGURED");

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("AI_EMPTY_RESPONSE");

  const result = JSON.parse(content) as AiInvoiceResult;

  await prisma.aiGenerationLog.create({
    data: {
      userId,
      prompt,
      resultJson: result,
      model: completion.model,
      tokensUsed: completion.usage?.total_tokens ?? null,
    },
  });

  return result;
}

/** 优化服务描述 */
export async function optimizeDescription(userId: string, description: string) {
  const plan = await getUserPlan(userId);
  if (!getPlanFeatures(plan).aiInvoice) {
    throw new Error("FEATURE_REQUIRES_PRO:aiInvoice");
  }

  const client = getOpenAI();
  if (!client) throw new Error("AI_NOT_CONFIGURED");

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Improve the invoice line item description to be professional and concise. Return plain text only.",
      },
      { role: "user", content: description },
    ],
    temperature: 0.4,
    max_tokens: 200,
  });

  const optimized = completion.choices[0]?.message?.content?.trim();
  if (!optimized) throw new Error("AI_EMPTY_RESPONSE");

  await prisma.aiGenerationLog.create({
    data: {
      userId,
      prompt: description,
      resultJson: { optimized },
      model: completion.model,
      tokensUsed: completion.usage?.total_tokens ?? null,
    },
  });

  return optimized;
}
