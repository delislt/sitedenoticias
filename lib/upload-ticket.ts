import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { HttpError } from "./http";

const claims = z
  .object({
    id: z.uuid(),
    owner: z.uuid(),
    kind: z.enum(["image", "video"]),
    expires: z.number().int(),
  })
  .strict();
function signature(payload: string, key: string) {
  return createHmac("sha256", key)
    .update("sis-media-upload-v1:" + payload)
    .digest();
}
export function issueUploadTicket(
  id: string,
  owner: string,
  kind: "image" | "video",
  key: string,
  now = Date.now(),
) {
  const payload = Buffer.from(
    JSON.stringify(
      claims.parse({ id, owner, kind, expires: now + 2 * 60 * 60 * 1000 }),
    ),
  ).toString("base64url");
  return payload + "." + signature(payload, key).toString("base64url");
}
export function verifyUploadTicket(
  ticket: string,
  owner: string,
  key: string,
  now = Date.now(),
) {
  try {
    const parts = ticket.split(".");
    if (parts.length !== 2) throw new Error("Invalid ticket");
    const expected = signature(parts[0], key);
    const actual = Buffer.from(parts[1], "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      throw new Error("Invalid signature");
    const value = claims.parse(
      JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")),
    );
    if (value.owner !== owner || value.expires <= now)
      throw new Error("Expired or foreign ticket");
    return value;
  } catch {
    throw new HttpError(
      403,
      "Autorização de envio inválida ou expirada. Selecione o arquivo novamente.",
    );
  }
}
