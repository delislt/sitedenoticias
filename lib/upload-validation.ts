import sharp from "sharp";
import { PDFDocument, PDFDict, PDFName } from "pdf-lib";
import { HttpError } from "./http";
export const MAX_FILE_BYTES = 4 * 1024 * 1024;
export async function validateImage(bytes: Buffer) {
  if (!bytes.length || bytes.length > MAX_FILE_BYTES)
    throw new HttpError(413, "A imagem deve ter até 4 MB.");
  try {
    const pipeline = sharp(bytes, {
      limitInputPixels: 20_000_000,
      failOn: "warning",
    });
    const meta = await pipeline.metadata();
    if (
      !["jpeg", "png", "webp"].includes(meta.format || "") ||
      !meta.width ||
      !meta.height ||
      meta.width > 6000 ||
      meta.height > 6000 ||
      (meta.pages || 1) !== 1
    )
      throw new Error("Invalid format");
    const output = await pipeline
      .rotate()
      .webp({ quality: 85 })
      .timeout({ seconds: 5 })
      .toBuffer();
    if (output.length > MAX_FILE_BYTES) throw new Error("Output too large");
    return output;
  } catch {
    throw new HttpError(
      400,
      "Envie JPEG, PNG ou WebP válido, sem animação, com até 6.000 px por lado e 20 megapixels.",
    );
  }
}
export async function validatePdf(bytes: Buffer) {
  if (!bytes.length || bytes.length > MAX_FILE_BYTES)
    throw new HttpError(413, "O PDF deve ter até 4 MB.");
  if (!bytes.subarray(0, 5).equals(Buffer.from("%PDF-")))
    throw new HttpError(400, "O arquivo não é um PDF.");
  try {
    const doc = await PDFDocument.load(bytes, {
      ignoreEncryption: false,
      updateMetadata: false,
      throwOnInvalidObject: true,
    });
    if (doc.getPageCount() < 1 || doc.getPageCount() > 200 || doc.isEncrypted)
      throw new Error("Invalid PDF");
    const forbidden = new Set([
      "JavaScript",
      "JS",
      "AA",
      "OpenAction",
      "Launch",
      "EmbeddedFiles",
      "EmbeddedFile",
      "RichMedia",
      "XFA",
      "SubmitForm",
      "ImportData",
      "GoToR",
    ]);
    for (const [, obj] of doc.context.enumerateIndirectObjects()) {
      if (obj instanceof PDFDict)
        for (const [key, value] of obj.entries()) {
          if (
            forbidden.has(key.decodeText()) ||
            (value instanceof PDFName && forbidden.has(value.decodeText()))
          )
            throw new Error("Active PDF");
        }
    }
    const clean = await PDFDocument.create();
    for (const page of await clean.copyPages(doc, doc.getPageIndices())) {
      page.node.delete(PDFName.of("Annots"));
      page.node.delete(PDFName.of("AA"));
      clean.addPage(page);
    }
    const output = Buffer.from(await clean.save());
    if (output.length > MAX_FILE_BYTES) throw new Error("Output too large");
    return output;
  } catch {
    throw new HttpError(
      400,
      "Envie um PDF de até 200 páginas, sem senha, scripts, anexos ou ações externas.",
    );
  }
}
export async function boundedForm(request: Request) {
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Arquivo ausente.");
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_FILE_BYTES + 65536) {
      await reader.cancel();
      throw new HttpError(413, "O envio ultrapassa 4 MB.");
    }
    chunks.push(value);
  }
  return new Response(Buffer.concat(chunks), {
    headers: { "Content-Type": request.headers.get("content-type") || "" },
  }).formData();
}
