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
  const form = new FormData();
  form.set("file", file);
  form.set("kind", kind);
  const response = await fetch("/api/upload", { method: "POST", body: form });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Falha no envio.");
  return data as { id: string; url: string };
}
