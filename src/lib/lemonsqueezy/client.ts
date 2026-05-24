/** Lemon Squeezy API 客户端 */

const API_BASE = "https://api.lemonsqueezy.com/v1";

export function getLemonSqueezyApiKey(): string | null {
  const key = process.env.LEMONSQUEEZY_API_KEY;
  if (!key || key.includes("YOUR_")) return null;
  return key;
}

export function isLemonSqueezyConfigured(): boolean {
  return Boolean(
    getLemonSqueezyApiKey() &&
      process.env.LEMONSQUEEZY_STORE_ID &&
      process.env.LEMONSQUEEZY_VARIANT_PRO &&
      process.env.LEMONSQUEEZY_VARIANT_BUSINESS
  );
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** 调用 Lemon Squeezy JSON:API */
export async function lemonSqueezyRequest<T>(
  path: string,
  options: RequestInit & { jsonBody?: unknown } = {}
): Promise<T> {
  const apiKey = getLemonSqueezyApiKey();
  if (!apiKey) throw new Error("LEMONSQUEEZY_NOT_CONFIGURED");

  const { jsonBody, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
      ...(rest.headers ?? {}),
    },
    body: jsonBody ? JSON.stringify(jsonBody) : rest.body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lemon Squeezy API ${res.status}: ${text.slice(0, 300)}`);
  }

  return res.json() as Promise<T>;
}

export type CheckoutResponse = {
  data: {
    id: string;
    attributes: {
      url: string;
      variant_id: number;
      created_at: string;
      checkout_data?: {
        custom?: { user_id?: string; target_plan?: string };
      };
    };
  };
};

export type SubscriptionListResponse = {
  data: Array<{
    id: string;
    attributes: {
      status: string;
      variant_id: number;
      created_at: string;
    };
  }>;
};

export type CheckoutListResponse = {
  data: Array<{
    id: string;
    attributes: {
      variant_id: number;
      created_at: string;
      checkout_data?: {
        custom?: { user_id?: string; target_plan?: string };
      };
    };
  }>;
};

export type SubscriptionResponse = {
  data: {
    id: string;
    attributes: {
      status: string;
      variant_id: number;
      customer_id: number;
      renews_at: string | null;
      ends_at: string | null;
      cancelled: boolean;
      urls: {
        customer_portal?: string;
      };
    };
  };
};
