"use client";

import { Button } from "@/components/auth/auth-ui";
import type { PreviewItem } from "./invoice-preview";

type LineItemsEditorProps = {
  items: PreviewItem[];
  onChange: (items: PreviewItem[]) => void;
};

const EMPTY_ITEM: PreviewItem = {
  description: "",
  quantity: 1,
  unitPrice: 0,
};

export function LineItemsEditor({ items, onChange }: LineItemsEditorProps) {
  function updateItem(index: number, patch: Partial<PreviewItem>) {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange(next);
  }

  function addItem() {
    onChange([...items, { ...EMPTY_ITEM }]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="hidden grid-cols-12 gap-2 text-xs font-medium text-slate-500 sm:grid">
        <div className="col-span-5">Service Name</div>
        <div className="col-span-2 text-right">Qty</div>
        <div className="col-span-2 text-right">Price</div>
        <div className="col-span-2 text-right">Amount</div>
        <div className="col-span-1" />
      </div>

      {items.map((item, index) => (
        <div
          key={index}
          className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-12 sm:border-0 sm:p-0"
        >
          <input
            className="col-span-5 h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Service description"
            value={item.description}
            onChange={(e) => updateItem(index, { description: e.target.value })}
          />
          <input
            type="number"
            min="0.0001"
            step="any"
            className="col-span-2 h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-right"
            value={item.quantity}
            onChange={(e) =>
              updateItem(index, { quantity: Number(e.target.value) || 0 })
            }
          />
          <input
            type="number"
            min="0"
            step="0.01"
            className="col-span-2 h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-right"
            value={item.unitPrice}
            onChange={(e) =>
              updateItem(index, { unitPrice: Number(e.target.value) || 0 })
            }
          />
          <div className="col-span-2 flex h-10 items-center justify-end text-sm font-medium text-slate-700">
            {(item.quantity * item.unitPrice).toFixed(2)}
          </div>
          <div className="col-span-1 flex items-center justify-end">
            <button
              type="button"
              onClick={() => removeItem(index)}
              disabled={items.length <= 1}
              className="text-sm text-slate-400 hover:text-error disabled:opacity-30"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        + Add Item
      </Button>
    </div>
  );
}
