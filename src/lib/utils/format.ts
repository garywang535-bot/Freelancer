/** 格式化金额为 USD 展示（阶段 5 将支持多币种） */
export function formatMoney(
  amount: number | string | { toString(): string },
  currency = "USD"
): string {
  const value = typeof amount === "number" ? amount : Number(amount.toString());
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

/** 格式化日期 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}
