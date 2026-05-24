/** 支持的币种（PRD 5.3） */
export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export function getCurrency(code: string) {
  return CURRENCIES.find((c) => c.code === code);
}

export function isValidCurrency(code: string): code is CurrencyCode {
  return CURRENCIES.some((c) => c.code === code);
}
