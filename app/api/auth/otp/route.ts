import { randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { currentSession } from "@/lib/auth";
import { publicClient } from "@/utils/supabase/public";
import {
  sameOrigin,
  boundedJson,
  databaseError,
  HttpError,
  failure,
} from "@/lib/http";
const cookieName = "sis-email-step";
const inputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("send") }).strict(),
  z
    .object({
      action: z.literal("verify"),
      code: z.string().regex(/^\d{6,10}$/),
    })
    .strict(),
]);
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const input = inputSchema.safeParse(await boundedJson(request, 1024));
    if (!input.success)
      throw new HttpError(400, "Confira o código recebido por email.");
    const { db, user, access } = await currentSession();
    if (!user)
      throw new HttpError(401, "Entre primeiro com email e senha ou Google.");
    if (!access.primary_valid || !user.email || !user.email_confirmed_at)
      throw new HttpError(
        403,
        "Confirme seu cadastro e entre com senha ou Google antes de solicitar o código.",
      );
    const jar = await cookies();
    // An isolated Auth client never replaces the browser's first-factor session.
    const otp = publicClient();
    if (input.data.action === "send") {
      const nonce = randomBytes(32).toString("hex");
      const started = await db.rpc("sis_email_otp_begin", { nonce });
      if (started.error) throw databaseError(started.error);
      const sent = await otp.auth.signInWithOtp({
        email: user.email,
        options: { shouldCreateUser: false },
      });
      if (sent.error)
        throw new HttpError(
          sent.error.status === 429 ? 429 : 503,
          "Não foi possível enviar o código agora. Aguarde um minuto e tente novamente.",
        );
      jar.set(cookieName, nonce, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/auth/otp",
        maxAge: 300,
      });
      return NextResponse.json(
        {
          message: "Código enviado. Ele deve ser confirmado em até 5 minutos.",
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const nonce = jar.get(cookieName)?.value;
    if (!nonce || !/^[a-f0-9]{64}$/.test(nonce))
      throw new HttpError(400, "Solicite um novo código neste navegador.");
    const attempt = randomUUID();
    const reserved = await db.rpc("sis_email_otp_attempt", { nonce, attempt });
    if (reserved.error) throw databaseError(reserved.error);
    if (!reserved.data)
      throw new HttpError(
        429,
        "Código expirado ou limite de tentativas atingido. Solicite um novo código.",
      );
    try {
      const verified = await otp.auth.verifyOtp({
        email: user.email,
        token: input.data.code,
        type: "email",
      });
      if (verified.error || verified.data.user?.id !== user.id)
        throw new HttpError(
          400,
          "Código inválido ou expirado. Confira o email mais recente.",
        );
      const completed = await otp.rpc("sis_email_otp_complete", {
        nonce,
        attempt,
      });
      if (completed.error) throw databaseError(completed.error);
      if (!completed.data)
        throw new HttpError(
          403,
          "Não foi possível confirmar esta sessão. Solicite outro código.",
        );
    } finally {
      // Revoke the temporary OTP-only session; access stays bound to the original.
      await otp.auth.signOut({ scope: "local" });
    }
    jar.set(cookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth/otp",
      maxAge: 0,
    });
    return NextResponse.json(
      { verified: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
