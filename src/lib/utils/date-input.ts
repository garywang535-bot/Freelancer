/** 格式化 Date 为 input[type=date] 值（服务端/客户端均可使用） */
export function toDateInputValue(date?: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

/** 默认到期日：30 天后 */
export function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}
