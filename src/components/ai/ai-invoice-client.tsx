"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/auth/auth-ui";
import { defaultLineItems } from "@/lib/utils/invoice-defaults";
import { defaultDueDate } from "@/lib/utils/date-input";

type ClientOption = { id: string; companyName: string };

type AiResult = {
  clientHint: string;
  currency: string;
  taxRatePercent: number;
  dueInDays: number;
  paymentTerms: string;
  notes: string;
  items: Array<{ description: string; quantity: number; unitPrice: number }>;
};

export function AiInvoiceClient({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(
    "Create an invoice for Google for website development, $3000 USD, due in 30 days"
  );
  const [result, setResult] = useState<AiResult | null>(null);
  const [clientId, setClientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "生成失败");
        setLoading(false);
        return;
      }
      setResult(json.data);

      const match = clients.find((c) =>
        c.companyName.toLowerCase().includes(json.data.clientHint.toLowerCase())
      );
      if (match) setClientId(match.id);
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  async function createInvoice() {
    if (!result || !clientId) {
      setError("请选择客户");
      return;
    }

    setCreating(true);
    setError(null);

    const due = new Date();
    due.setDate(due.getDate() + result.dueInDays);

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          currency: result.currency,
          taxRatePercent: result.taxRatePercent,
          dueDate: due.toISOString(),
          paymentTerms: result.paymentTerms,
          notes: result.notes,
          items: result.items.length ? result.items : defaultLineItems(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "创建失败");
        setCreating(false);
        return;
      }
      router.push(`/invoices/${json.data.id}/edit`);
    } catch {
      setError("网络错误");
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/invoices" className="text-sm text-primary hover:underline">
          ← 返回 Invoice 列表
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-slate-900">AI Invoice</h1>
      <p className="mt-1 text-sm text-slate-600">用自然语言描述，自动生成 Invoice 草稿</p>

      <div className="mt-8 max-w-2xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Describe your work
          </label>
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="e.g. Invoice Shopify for logo design $1500 CAD"
          />
        </div>

        <Button onClick={generate} disabled={loading}>
          {loading ? "生成中..." : "Generate Invoice"}
        </Button>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-error">{error}</p>
        ) : null}

        {result ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold">AI 生成结果</h2>
            <pre className="mt-3 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700">选择客户</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
              >
                <option value="">Select Client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <Button className="mt-4" onClick={createInvoice} disabled={creating}>
              {creating ? "创建中..." : "创建 Draft Invoice"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
