import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { generatePdfBuffer, generateDocxBuffer, generateAndStoreDocuments } from "@/lib/services/pdf.service";

type RouteContext = { params: Promise<{ id: string }> };

/** 下载 Invoice PDF */
export async function GET(_request: NextRequest, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;

  // 尝试生成并缓存到 R2
  await generateAndStoreDocuments(user.id, id).catch(() => null);

  const buffer = await generatePdfBuffer(user.id, id);
  if (!buffer) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${id}.pdf"`,
    },
  });
}
