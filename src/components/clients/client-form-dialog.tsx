"use client";

import { useEffect, useState } from "react";
import { COUNTRIES } from "@/lib/constants/countries";
import { Button, Input } from "@/components/auth/auth-ui";
import { cn } from "@/lib/utils/cn";

export type ClientFormValues = {
  companyName: string;
  contactName: string;
  email: string;
  country: string;
  address: string;
  vatNumber: string;
  notes: string;
};

const EMPTY_FORM: ClientFormValues = {
  companyName: "",
  contactName: "",
  email: "",
  country: "US",
  address: "",
  vatNumber: "",
  notes: "",
};

type ClientFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: Partial<ClientFormValues>;
  onClose: () => void;
  onSuccess: () => void;
  clientId?: string;
};

export function ClientFormDialog({
  open,
  mode,
  initialValues,
  onClose,
  onSuccess,
  clientId,
}: ClientFormDialogProps) {
  const [form, setForm] = useState<ClientFormValues>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY_FORM, ...initialValues });
      setError(null);
    }
  }, [open, initialValues]);

  if (!open) return null;

  function updateField<K extends keyof ClientFormValues>(
    key: K,
    value: ClientFormValues[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      ...form,
      address: form.address || null,
      vatNumber: form.vatNumber || null,
      notes: form.notes || null,
    };

    try {
      const url =
        mode === "create" ? "/api/clients" : `/api/clients/${clientId}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? "操作失败");
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="关闭"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">
          {mode === "create" ? "新建客户" : "编辑客户"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Input
            label="Company Name"
            name="companyName"
            required
            value={form.companyName}
            onChange={(e) => updateField("companyName", e.target.value)}
          />
          <Input
            label="Contact Name"
            name="contactName"
            required
            value={form.contactName}
            onChange={(e) => updateField("contactName", e.target.value)}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />

          <div className="space-y-1.5">
            <label htmlFor="country" className="block text-sm font-medium text-slate-700">
              Country
            </label>
            <select
              id="country"
              name="country"
              required
              value={form.country}
              onChange={(e) => updateField("country", e.target.value)}
              className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="address" className="block text-sm font-medium text-slate-700">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              rows={2}
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <Input
            label="VAT Number"
            name="vatNumber"
            value={form.vatNumber}
            onChange={(e) => updateField("vatNumber", e.target.value)}
          />

          <div className="space-y-1.5">
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-error">{error}</p>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "保存中..." : mode === "create" ? "创建" : "保存"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** 文本域标签样式复用 */
export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("block text-sm font-medium text-slate-700")}
    >
      {children}
    </label>
  );
}
