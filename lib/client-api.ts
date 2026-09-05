export async function command<T = { id?: string; version?: number }>(
  act: string,
  data: unknown,
  operation = crypto.randomUUID(),
): Promise<T> {
  const response = await fetch("/api/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ act, data, operation }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Não foi possível salvar.");
  return result as T;
}
export async function readApi<T>(
  url: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, { cache: "no-store", signal });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Serviço indisponível.");
  return data as T;
}
export async function uploadFile(file: File, kind: "image" | "pdf" = "image") {
  const form = new FormData();
  form.set("file", file);
  form.set("kind", kind);
  const response = await fetch("/api/upload", { method: "POST", body: form });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Falha no envio.");
  return data as { id: string; url: string };
}
