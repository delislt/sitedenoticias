import { NextResponse } from "next/server";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = new Set([
    new URL(request.url).origin,
    process.env.NEXT_PUBLIC_SITE_URL || "https://sisnoticias.vercel.app",
  ]);
  if (process.env.NODE_ENV === "development") {
    allowed.add("http://127.0.0.1:3000");
    allowed.add("http://localhost:3000");
  }
  if (
    !origin ||
    !allowed.has(origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new HttpError(403, "Origem da solicitação inválida.");
}
export async function boundedJson(request: Request, maximum = 300000) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new HttpError(415, "Envie dados JSON.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Dados ausentes.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maximum) {
      await reader.cancel();
      throw new HttpError(413, "Solicitação muito grande.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new HttpError(400, "Dados inválidos.");
  }
}
export function databaseError(error: { code?: string; message?: string }) {
  const status =
    error.code === "42501"
      ? 403
      : error.code === "P0002"
        ? 404
        : error.code === "40001" || error.code === "23505"
          ? 409
          : error.code === "P0001"
            ? 429
            : ["22023", "23514", "22P02", "23502", "23503"].includes(
                  error.code || "",
                )
              ? 400
              : 503;
  const message = ["42501", "P0002", "40001", "22023", "P0001"].includes(
    error.code || "",
  )
    ? error.message || "Operação recusada."
    : status === 409
      ? "Este endereço ou registro já existe."
      : status === 400
        ? "Confira os campos e os vínculos do formulário."
        : "Serviço de dados indisponível. Tente novamente.";
  return new HttpError(status, message);
}
export function failure(error: unknown) {
  const e =
    error instanceof HttpError
      ? error
      : new HttpError(
          503,
          "Serviço temporariamente indisponível. Tente novamente.",
        );
  return NextResponse.json(
    { error: e.message },
    { status: e.status, headers: { "Cache-Control": "no-store" } },
  );
}
