/** 金额保留两位小数 */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export type LineItemCalc = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

/** 计算行项目金额 */
export function calcLineTotal(quantity: number, unitPrice: number): number {
  return roundMoney(quantity * unitPrice);
}

/** 计算 Invoice 合计（taxRatePercent 为 0-100） */
export function calcInvoiceTotals(
  items: Array<{ quantity: number; unitPrice: number }>,
  taxRatePercent: number
) {
  const computedItems: LineItemCalc[] = items.map((item) => ({
    description: "",
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: calcLineTotal(item.quantity, item.unitPrice),
  }));

  const subtotal = roundMoney(
    computedItems.reduce((sum, item) => sum + item.lineTotal, 0)
  );
  const taxRate = taxRatePercent / 100;
  const taxAmount = roundMoney(subtotal * taxRate);
  const totalAmount = roundMoney(subtotal + taxAmount);

  return { subtotal, taxRate, taxAmount, totalAmount, items: computedItems };
}

/** 存储用税率（0-1）转展示百分比 */
export function taxRateToPercent(stored: number): number {
  return roundMoney(stored * 100);
}

/** 展示百分比转存储税率（0-1） */
export function percentToTaxRate(percent: number): number {
  return percent / 100;
}
