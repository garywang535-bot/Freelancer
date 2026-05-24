import { z } from "zod";

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  companyName: z.string().trim().max(200).optional().nullable(),
  website: z.string().trim().max(500).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  taxId: z.string().trim().max(100).optional().nullable(),
  logoUrl: z.string().trim().max(500).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  postalCode: z.string().trim().max(20).optional().nullable(),
  country: z.string().trim().max(2).optional().nullable(),
  locale: z.enum(["en", "zh", "ja", "es"]).optional(),
  timezone: z.string().trim().max(64).optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/** 校验 URL 字段，空值视为 null */
export function normalizeUrlField(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (!value || value.trim() === "") return null;
  try {
    new URL(value);
    return value.trim();
  } catch {
    return null;
  }
}
