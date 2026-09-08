"use client";

import HCaptcha from "@hcaptcha/react-hcaptcha";
import type { RefObject } from "react";

export function AuthCaptcha({
  captchaRef,
  onVerify,
  onInvalidate,
}: {
  captchaRef: RefObject<HCaptcha | null>;
  onVerify: (token: string) => void;
  onInvalidate: (failed: boolean) => void;
}) {
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

  if (!siteKey)
    return (
      <p role="alert" className="text-sm text-gold">
        A verificação de segurança está indisponível no momento.
      </p>
    );

  return (
    <div
      className="max-w-full overflow-x-auto"
      role="group"
      aria-label="Verificação de segurança"
    >
      <HCaptcha
        ref={captchaRef}
        sitekey={siteKey}
        theme="dark"
        languageOverride="pt-BR"
        sentry={false}
        onVerify={onVerify}
        onExpire={() => onInvalidate(false)}
        onError={() => onInvalidate(true)}
        onChalExpired={() => onInvalidate(false)}
      />
    </div>
  );
}
