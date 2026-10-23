export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function requestJson<T>(
  url: string,
  init: RequestInit,
  retry = false,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(url, init);
      if (retry && attempt === 0 && [502, 503, 504].includes(response.status)) {
        await response.body?.cancel();
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
      const data = await response.json().catch((error: unknown) => {
        if (error instanceof SyntaxError) return null;
        throw error;
      });
      if (!response.ok) {
        const fallback =
          response.status === 401
            ? "Sua sessão expirou. Entre novamente na conta."
            : response.status === 413
              ? "A matéria excede o tamanho permitido para envio. Reduza o texto ou as fontes."
              : "Serviço temporariamente indisponível. Tente novamente.";
        const reference = response.headers.get("X-Request-ID");
        throw new ApiError(
          (data?.error || fallback) +
            (reference ? " Referência: " + reference : ""),
          response.status,
        );
      }
      if (data === null)
        throw new Error(
          "O servidor não confirmou a operação. Tente novamente.",
        );
      return data as T;
    } catch (error) {
      if (init.signal?.aborted) throw error;
      if (!(error instanceof TypeError)) throw error;
      if (retry && attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
      throw new Error(
        "Falha de conexão com o servidor. Tente novamente sem fechar esta página.",
      );
    }
  }
}

export async function command<T = { id?: string; version?: number }>(
  act: string,
  data: unknown,
  operation = crypto.randomUUID(),
): Promise<T> {
  // The same operation key and payload make article-save retries idempotent.
  return requestJson<T>(
    "/api/actions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ act, data, operation }),
    },
    act === "article.save",
  );
}
export async function readApi<T>(
  url: string,
  signal?: AbortSignal,
): Promise<T> {
  return requestJson<T>(url, { cache: "no-store", signal }, true);
}
export async function uploadFile(
  file: File,
  kind: "image" | "video" | "pdf" = "image",
) {
  if (kind === "video" || kind === "image") {
    const { MAX_VIDEO_BYTES, MAX_IMAGE_BYTES } = await import("./media-limits");
    if (file.size > (kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES))
      throw new Error(
        kind === "image"
          ? "A imagem deve ter até 15 MB."
          : "O vídeo deve ter até 30 MB.",
      );
    const authorization = await requestJson<{
      path: string;
      token: string;
      ticket: string;
    }>("/api/upload/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: "prepare", kind, bytes: file.size }),
    });
    const { createClient } = await import("@/utils/supabase/client");
    const uploaded = await createClient()
      .storage.from("sis-images")
      .uploadToSignedUrl(authorization.path, authorization.token, file, {
        contentType: kind === "video" ? "video/mp4" : file.type || "image/webp",
        cacheControl: "60",
      });
    if (uploaded.error)
      throw new Error(
        "Não foi possível enviar o arquivo. Confira sua conexão e tente novamente.",
      );
    return requestJson<{ id: string; url: string }>(
      "/api/upload/media",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "finish", ticket: authorization.ticket }),
      },
      true,
    );
  }
  const form = new FormData();
  form.set("file", file);
  form.set("kind", kind);
  const response = await fetch("/api/upload", { method: "POST", body: form });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Falha no envio.");
  return data as { id: string; url: string };
}
