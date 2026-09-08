import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const source = readFileSync(new URL("../" + path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const exports = {};
  runInNewContext(outputText, {
    exports,
    process: { env: {} },
    require: (id) => Object.hasOwn(mocks, id) ? mocks[id] : require(id),
    URL,
  });
  return exports;
}
const domain = load("lib/domain.ts");
const redirect = (url) => { throw new Error("redirect:" + url); };
const access = { user_id: "reader", roles: ["reader"], verified: true, primary_valid: true };
const { ReaderAccount } = load("components/ReaderAccount.tsx", {
  "next/navigation": { useRouter: () => ({}) },
  "next/link": { default: (props) => React.createElement("a", props) },
  "@/utils/supabase/client": {},
  "@/lib/client-api": {},
  "@/lib/domain": domain,
  "@/components/AvatarEditor": { AvatarEditor: () => null },
  "@/components/EmailSecondFactor": { EmailSecondFactor: () => React.createElement("p", null, "REQUIRED_OTP") },
  "@/components/AuthCaptcha": { AuthCaptcha: () => React.createElement("p", null, "CAPTCHA") },
});

for (const provider of ["google", "email"]) {
  test(provider + ": confirmed account has no verification prompt or loop", async () => {
    const user = { email_confirmed_at: "2026-09-06T00:00:00Z", app_metadata: { provider } };
    const mocks = {
      "@/lib/auth": { currentSession: async () => ({ user, access }) },
      "@/lib/resources": { getSettings: async () => ({ readers_enabled: true }) },
      "@/lib/domain": domain,
      "next/navigation": { redirect },
      "next/headers": { cookies: async () => ({ get: () => undefined }) },
      "@/components/ReaderAccount": { ReaderAccount },
      "@/components/EmailVerification": { EmailVerification: () => null },
    };
    const account = load("app/conta/page.tsx", mocks).default;
    const html = renderToStaticMarkup(await account({ searchParams: Promise.resolve({}) }));
    assert.match(html, /Seu perfil/);
    assert.doesNotMatch(html, /Reenviar|Verificação adicional|REQUIRED_OTP|Email confirmado/);
    const verification = load("app/conta/verificar-email/page.tsx", mocks).default;
    await assert.rejects(verification({ searchParams: Promise.resolve({}) }), /redirect:\/conta\?next=/);
  });
}
test("unconfirmed backend state wins over provider metadata and URL flags", async () => {
  const account = load("app/conta/page.tsx", {
    "@/lib/auth": { currentSession: async () => ({
      user: { email_confirmed_at: null, app_metadata: { provider: "google" }, user_metadata: { email_verified: true } },
      access,
    }) },
    "@/lib/resources": { getSettings: async () => ({ readers_enabled: true }) },
    "@/lib/domain": domain,
    "next/navigation": { redirect },
    "next/headers": { cookies: async () => ({ get: () => undefined }) },
    "@/components/ReaderAccount": { ReaderAccount },
  }).default;
  await assert.rejects(account({ searchParams: Promise.resolve({}) }), /redirect:\/conta\/verificar-email/);
});
test("required backend step-up remains enforced", () => {
  const html = renderToStaticMarkup(React.createElement(ReaderAccount, {
    access: { ...access, verified: false }, emailVerified: true, next: "/", registration: true,
  }));
  assert.match(html, /REQUIRED_OTP/);
  assert.doesNotMatch(html, /Seu perfil/);
});
test("email confirmation verifies the token once with the server client", async () => {
  let calls = 0;
  const route = load("app/auth/confirm/route.ts", {
    "next/headers": { cookies: async () => ({}) },
    "next/server": { NextResponse: { redirect: (url) => ({ location: String(url) }) } },
    "@/utils/supabase/server": { createClient: () => ({ auth: {
      verifyOtp: async (params) => {
        calls++;
        assert.deepEqual({ ...params }, {
          token_hash: "oh9xUIbE-oNJBwq-5xDrPUMzszBcEECq49CK34OJCfo",
          type: "email",
        });
        return { error: null };
      },
      getUser: async () => ({ data: { user: null } }),
    } }) },
    "@/lib/domain": domain,
  });
  const nextUrl = new URL("https://sisnoticias.vercel.app/auth/confirm?token_hash=oh9xUIbE-oNJBwq-5xDrPUMzszBcEECq49CK34OJCfo&type=email&next=%2Fconta");
  const response = await route.GET({ nextUrl });
  assert.equal(calls, 1);
  assert.equal(response.location, "https://sisnoticias.vercel.app/conta");
});
