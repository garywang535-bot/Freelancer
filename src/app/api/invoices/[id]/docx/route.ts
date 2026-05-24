import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { generateDocxBuffer, generateAndStoreDocuments } from "@/lib/services/pdf.service";

type RouteContext = { params: Promise<{ id: string }> };

/** 下载 Invoice DOCX */
export async function GET(_request: NextRequest, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;

  await generateAndStoreDocuments(user.id, id).catch(() => null);

  const buffer = await generateDocxBuffer(user.id, id);
  if (!buffer) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="invoice-${id}.docx"`,
    },
  });
}
