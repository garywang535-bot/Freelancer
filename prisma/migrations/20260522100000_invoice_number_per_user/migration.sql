-- Invoice 编号改为「每用户唯一」，允许多个用户同时拥有 INV-2026-0001
DROP INDEX IF EXISTS "invoices_invoice_number_key";

CREATE UNIQUE INDEX "invoices_user_id_invoice_number_key" ON "invoices"("user_id", "invoice_number");
