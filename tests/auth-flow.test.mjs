import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
function load(path, mocks = {}, env = {}) {
  const source = readFileSync(new URL("../" + path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const exports = {};
  runInNewContext(outputText, {
    exports,
    process: { env },
    require: (id) => Object.hasOwn(mocks, id) ? mocks[id] : require(id),
    URL,
    Response,
    Buffer,
    fetch,
    crypto,
    console: { error() {} },
  });
  return exports;
}

test("30 MB video and 15 MB image go directly to storage; app requests carry only small JSON", async (t) => {
  const requests = [];
  let uploadedFile;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    requests.push({ url, payload: JSON.parse(init.body), bytes: init.body.length });
    return Response.json(JSON.parse(init.body).stage === "prepare" ? { path: "owner/pending.upload", token: "test-upload-token", ticket: "test-ticket" } : { id: "video", url: "/api/media/video" });
  });
  const { uploadFile } = load("lib/client-api.ts", {
    "./media-limits": { MAX_VIDEO_BYTES: 30 * 1024 * 1024, MAX_IMAGE_BYTES: 15 * 1024 * 1024 },
    "@/utils/supabase/client": { createClient: () => ({ storage: { from: () => ({
      uploadToSignedUrl: async (_path, _token, file) => { uploadedFile = file; return { error: null }; },
    }) } }) },
  });
  const file = new File([new Uint8Array(30 * 1024 * 1024)], "video.mp4", { type: "video/mp4" });
  const result = await uploadFile(file, "video");
  assert.equal(result.id, "video");
  assert.equal(uploadedFile, file);
  assert.deepEqual(requests.map((r) => r.payload.stage), ["prepare", "finish"]);
  assert.ok(requests.every((r) => r.bytes < 2048));
  const image = new File([new Uint8Array(15 * 1024 * 1024)], "image.jpg", { type: "image/jpeg" });
  await uploadFile(image, "image");
  assert.equal(uploadedFile, image);
  assert.equal(requests[2].payload.kind, "image");
  assert.ok(requests.every((r) => r.bytes < 2048));
  await assert.rejects(uploadFile(new File([new Uint8Array(30 * 1024 * 1024 + 1)], "too-big.mp4"), "video"), /30 MB/);
  await assert.rejects(uploadFile(new File([new Uint8Array(15 * 1024 * 1024 + 1)], "too-big.jpg"), "image"), /15 MB/);
  assert.equal(requests.length, 4);
});

test("direct-upload completion validates privately before registering the final video", async () => {
  const owner = "22222222-2222-4222-8222-222222222222";
  const id = "11111111-1111-4111-8111-111111111111";
  let valid = false;
  let registered = false;
  let kind = "video";
  const writes = [];
  const storage = {
    download: async () => ({ data: new Blob(["test video bytes"]), error: null }),
    upload: async (path) => { writes.push(path); return { error: null }; },
    remove: async () => ({ error: null }),
  };
  class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
  const { POST } = load("app/api/upload/media/route.ts", {
    "@/lib/auth": { requireAccess: async () => ({ user: { id: owner }, db: {} }) },
    "@/utils/supabase/privileged": { privilegedClient: () => ({ storage: { from: () => storage }, from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: registered ? { id } : null, error: null }) }) }) }),
      insert: async () => { registered = true; return { error: null }; },
    }) }) },
    "@/lib/http": { sameOrigin() {}, boundedJson: (r) => r.json(), HttpError, databaseError: (e) => e, failure: (e) => Response.json({ error: e.message }, { status: e.status || 503 }) },
    "@/lib/upload-ticket": { verifyUploadTicket: () => ({ id, kind }) },
    "@/lib/video-validation": { validateVideo: (bytes) => { if (!valid) throw new HttpError(400, "Vídeo inválido"); return bytes; } },
    "@/lib/upload-validation": { validateImage: async () => Buffer.from("validated webp") },
    "@/lib/media-limits": { MAX_VIDEO_BYTES: 30 * 1024 * 1024, MAX_IMAGE_BYTES: 15 * 1024 * 1024 },
  }, { SUPABASE_SERVICE_ROLE_KEY: "isolated-test-key" });
  const finish = () => POST(new Request("https://sisnoticias.vercel.app/api/upload/media", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ stage: "finish", ticket: "test-ticket" }) }));
  assert.equal((await finish()).status, 400);
  assert.equal(registered, false);
  assert.equal(writes.length, 0);
  valid = true;
  assert.equal((await finish()).status, 200);
  assert.equal(registered, true);
  assert.deepEqual(writes, [owner + "/" + id + ".mp4"]);
  assert.equal((await finish()).status, 200);
  assert.equal(writes.length, 1);
  kind = "image";
  registered = false;
  assert.equal((await finish()).status, 200);
  assert.equal(writes[1], owner + "/" + id + ".webp");
});

test("admin logout leaves another device's session active", async () => {
  const sessions = new Set(["this-device", "other-device"]);
  const { LogoutButton } = load("components/admin/LogoutButton.tsx", {
    "next/navigation": { useRouter: () => ({ push() {}, refresh() {} }) },
    "@/utils/supabase/client": { createClient: () => ({ auth: {
      signOut: async (options) => {
        if (options?.scope === "local") sessions.delete("this-device");
        else sessions.clear();
        return { error: null };
      },
    } }) },
  });
  await LogoutButton().props.onClick();
  assert.deepEqual([...sessions], ["other-device"]);
});

test("temporary auth failures do not masquerade as a signed-out account", async () => {
  class HttpError extends Error {
    constructor(status, message) { super(message); this.status = status; }
  }
  for (const [error, expected] of [
    [{ status: 0, name: "AuthRetryableFetchError" }, 503],
    [{ status: 503 }, 503],
    [{ status: 429 }, 503],
    [{ status: 400, name: "AuthSessionMissingError" }, 401],
    [null, 401],
  ]) {
    const { requireAccess } = load("lib/auth.ts", {
      "server-only": {},
      react: { cache: (fn) => fn },
      "next/headers": { cookies: async () => ({}) },
      "@/utils/supabase/server": { createClient: () => ({ auth: {
        getUser: async () => ({ data: { user: null }, error }),
      } }) },
      "@/lib/domain": {},
      "@/lib/http": { HttpError },
    });
    await assert.rejects(requireAccess(), (e) => {
      assert.equal(e.status, expected);
      return true;
    });
  }
});

test("article API generates addresses, ignores invalid legacy input, and preserves existing links", async () => {
  const calls = [];
  let stored = { slug: "endereco-publicado" };
  class HttpError extends Error {
    constructor(status, message) { super(message); this.status = status; }
  }
  const { POST } = load("app/api/actions/route.ts", {
    "next/cache": { revalidatePath() {} },
    "@/lib/auth": { requireAccess: async () => ({ db: {
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: stored, error: null }) }) }) }),
      rpc: async (_fn, args) => {
        calls.push(args);
        return { data: { id: "saved", version: 2 }, error: null };
      },
    } }) },
    "@/lib/http": {
      HttpError,
      sameOrigin() {},
      boundedJson: (req) => req.json(),
      databaseError: (e) => e,
      failure: (e) => Response.json({ error: e.message }, { status: e.status || 503 }),
    },
  });
  const operation = "10000000-0000-4000-8000-000000000001";
  const submit = (data, key = operation) => POST(new Request("https://sisnoticias.vercel.app/api/actions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ act: "article.save", data, operation: key }),
  }));
  assert.equal((await submit({ title: "Nova matéria" })).status, 200);
  assert.match(calls[0].d.slug, /^[a-z0-9][a-z0-9-]{0,149}$/);
  assert.equal((await submit({ title: "Nova matéria", slug: "Endereço inválido!" })).status, 200);
  assert.equal(calls[0].d.slug, calls[1].d.slug);
  assert.equal((await submit({}, "10000000-0000-4000-8000-000000000002")).status, 200);
  assert.notEqual(calls[0].d.slug, calls[2].d.slug);
  const id = "20000000-0000-4000-8000-000000000001";
  assert.equal((await submit({ id, version: 1, title: "Outro título", slug: "Tentativa de trocar" })).status, 200);
  assert.equal(calls[3].d.slug, "endereco-publicado");
  stored = null;
  assert.equal((await submit({ id, version: 1 })).status, 404);
  assert.equal((await submit({ id: "not-a-uuid" })).status, 400);
  assert.equal(calls.length, 4);
});
const domain = load("lib/domain.ts");
test("cover media uses stored MIME and preserves existing image records", async () => {
  const videoId = "11111111-1111-4111-8111-111111111111";
  const imageId = "22222222-2222-4222-8222-222222222222";
  const original = [
    { cover_image: "/api/media/" + videoId },
    { cover_image: "/api/media/" + imageId },
    { cover_image: "/images/existing.jpg" },
  ];
  const { withCoverMedia } = load("lib/supabase-articles.ts", {
    "server-only": {},
    react: { cache: (fn) => fn },
    "@/utils/supabase/public": {},
    "@/lib/domain": domain,
    "@/lib/http": { databaseError: (e) => e },
  });
  const result = await withCoverMedia(original, {
    from: () => ({ select: () => ({ in: async () => ({ data: [
      { id: videoId, mime: "video/mp4" },
      { id: imageId, mime: "image/webp" },
    ], error: null }) }) }),
  });
  assert.deepEqual(Array.from(result, (row) => row.cover_media_type), ["video", "image", "image"]);
  assert.ok(original.every((row) => row.cover_media_type === undefined));
  assert.equal(result[2].cover_image, original[2].cover_image);
});
const redirect = (url) => { throw new Error("redirect:" + url); };
const access = {
  user_id: "reader",
  roles: ["reader"],
  verified: true,
  primary_valid: true,
  display_name: "Leitor SIS",
};
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
const { EmailVerification } = load("components/EmailVerification.tsx", {
  "next/link": { default: (props) => React.createElement("a", props) },
  "@/utils/supabase/client": { createClient: () => ({}) },
  "@/lib/domain": domain,
  "@/components/AuthCaptcha": {
    AuthCaptcha: () => React.createElement("p", null, "CAPTCHA"),
  },
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
    assert.match(html, /Nome atual.*Leitor SIS/s);
    assert.doesNotMatch(html, /Reenviar|Verificação adicional|REQUIRED_OTP|Email confirmado/);
    const verification = load("app/conta/verificar-email/page.tsx", mocks).default;
    await assert.rejects(verification({ searchParams: Promise.resolve({}) }), /redirect:\/conta\?next=/);
  });
}
test("post-signup confirmation uses the current email and enforces the countdown", () => {
  const html = renderToStaticMarkup(
    React.createElement(EmailVerification, {
      initialEmail: "leitor@example.com",
      next: "/",
      postSignup: true,
    }),
  );
  assert.match(html, /Confirme seu e-mail/);
  assert.match(html, /leitor@example.com/);
  assert.match(html, /Reenviar em 60s/);
  assert.doesNotMatch(html, /type="email"/);
});
test("manual confirmation keeps the email and captcha flow", () => {
  const html = renderToStaticMarkup(
    React.createElement(EmailVerification, {
      initialEmail: "",
      next: "/",
      postSignup: false,
    }),
  );
  assert.match(html, /Solicite outro e-mail de confirmação/);
  assert.match(html, /type="email"/);
  assert.match(html, /CAPTCHA/);
});
test("comment avatar is served only when the comment is visible", async () => {
  const commentId = "a9771a09-d54c-4af5-b614-698843435bcf";
  const authorId = "e3d0b34b-49a0-467b-8db8-29605f140dce";
  let downloaded = "";
  const route = load("app/api/comments/[id]/avatar/route.ts", {
    "next/headers": { cookies: async () => ({}) },
    "@/utils/supabase/server": {
      createClient: () => ({
        from: () => ({
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: { id: commentId }, error: null }) }),
          }),
        }),
      }),
    },
    "@/utils/supabase/privileged": {
      privilegedClient: () => ({
        from: () => ({
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: { author_id: authorId }, error: null }) }),
          }),
        }),
        storage: {
          from: () => ({
            download: async (path) => {
              downloaded = path;
              return { data: new Blob(["avatar"], { type: "image/webp" }), error: null };
            },
          }),
        },
      }),
    },
    "@/lib/http": { databaseError: (error) => error, failure: () => new Response(null, { status: 500 }) },
  });
  const response = await route.GET(new Request("https://sisnoticias.vercel.app"), {
    params: Promise.resolve({ id: commentId }),
  });
  assert.equal(response.status, 200);
  assert.equal(downloaded, authorId + "/avatar.webp");
});
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
test("legacy email confirmation verifies the token once with the server client", async () => {
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
  const nextUrl = new URL("https://sisnoticias.vercel.app/auth/confirm?token_hash=oh9xUIbE-oNJBwq-5xDrPUMzszBcEECq49CK34OJCfo&next=%2Fconta");
  const response = await route.GET({ nextUrl });
  assert.equal(calls, 1);
  assert.equal(response.location, "https://sisnoticias.vercel.app/conta");
});
