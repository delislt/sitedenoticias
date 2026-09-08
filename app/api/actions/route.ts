import { z } from "zod";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAccess } from "@/lib/auth";
import {
  sameOrigin,
  boundedJson,
  HttpError,
  databaseError,
  failure,
} from "@/lib/http";
const schema = z
  .object({
    act: z.enum([
      "article.save",
      "article.delete",
      "comment.create",
      "comment.edit",
      "comment.remove",
      "comment.report",
      "profile",
      "bookmark",
      "correction",
      "moderate",
      "settings",
      "role",
      "correction.resolve",
      "session",
      "update",
      "document",
      "announcement",
      "account.erase",
    ]),
    data: z.record(z.string(), z.unknown()),
    operation: z.uuid(),
  })
  .strict();
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const input = schema.safeParse(await boundedJson(request));
    if (!input.success) throw new HttpError(400, "Solicitação inválida.");
    const { act, data, operation } = input.data;
    const wanted =
      act === "moderate"
        ? (["moderator"] as const)
        : ["settings", "role"].includes(act)
          ? (["admin"] as const)
          : [
                "session",
                "update",
                "document",
                "announcement",
                "correction.resolve",
              ].includes(act)
            ? (["editor"] as const)
            : ["article.save", "article.delete"].includes(act)
              ? (["journalist", "editor"] as const)
              : [];
    const { db } = await requireAccess(...wanted);
    if (act === "settings" && data.readers_enabled === true) {
      const auth = await fetch(
        process.env.NEXT_PUBLIC_SUPABASE_URL! + "/auth/v1/settings",
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
          },
          cache: "no-store",
        },
      );
      if (!auth.ok)
        throw new HttpError(
          503,
          "Não foi possível conferir o cadastro de leitores.",
        );
      const settings = await auth.json();
      if (settings.disable_signup)
        throw new HttpError(
          409,
          "O cadastro está fechado no Supabase. A administração deve habilitar novos usuários em Authentication antes de abrir o formulário.",
        );
    }
    const result = await db.rpc("sis_mutate", { act, d: data, operation });
    if (result.error) throw databaseError(result.error);
    revalidatePath("/", "layout");
    return NextResponse.json(result.data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}
