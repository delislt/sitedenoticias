import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("Email step-up binds both factors to one active session", async (t) => {
  const db = new PGlite();
  for (const file of [
    "tests/bootstrap.sql",
    "supabase/migrations/20260905140355_sis_foundation.sql",
    "supabase/migrations/20260905140644_sis_policy_indexes.sql",
    "supabase/migrations/20260905214706_email_otp_access.sql",
    "supabase/migrations/20260908120000_article_delete.sql",
  ])
    await db.exec(await readFile(file, "utf8"));
  const user = "00000000-0000-4000-8000-000000000001",
    other = "00000000-0000-4000-8000-000000000002";
  const first = crypto.randomUUID(),
    second = crypto.randomUUID(),
    third = crypto.randomUUID(),
    foreign = crypto.randomUUID();
  await db.query("update auth.users set email=id::text||'@example.invalid'");
  for (const [s, u] of [
    [first, user],
    [second, user],
    [third, user],
    [foreign, other],
  ])
    await db.query("insert into auth.sessions values($1,$2)", [s, u]);
  const as = async (
    s,
    method,
    fn,
    u = user,
    when = Math.floor(Date.now() / 1000),
  ) => {
    await db.query("select set_config('request.jwt.claims',$1,false)", [
      JSON.stringify({
        sub: u,
        session_id: s,
        amr: [{ method, timestamp: when }],
        user_metadata: { role: "admin", email_otp_verified: true },
      }),
    ]);
    await db.exec("set role authenticated");
    try {
      return await fn();
    } finally {
      await db.exec("reset role");
    }
  };
  const access = () =>
    db.query("select sis_access() a").then((r) => r.rows[0].a);
  const begin = (n) => db.query("select sis_email_otp_begin($1)", [n]);
  const attempt = (n, a) =>
    db
      .query("select sis_email_otp_attempt($1,$2) ok", [n, a])
      .then((r) => r.rows[0].ok);
  const complete = (n, a) =>
    db
      .query("select sis_email_otp_complete($1,$2) ok", [n, a])
      .then((r) => r.rows[0].ok);
  const nonce = "a".repeat(64),
    id = crypto.randomUUID();
  await t.test(
    "SMTP staging preserves password/Google login without claiming OTP",
    async () => {
      const a = await as(first, "password", access);
      assert.equal(a.verified, true);
      assert.equal(a.email_otp_verified, false);
      assert.equal((await as(third, "oauth", access)).verified, true);
    },
  );
  await db.exec("update private.auth_settings set email_otp_required=true");
  await t.test(
    "mandatory mode denies password alone, OTP alone and forged metadata",
    async () => {
      assert.equal((await as(first, "password", access)).verified, false);
      assert.equal((await as(second, "otp", access)).verified, false);
      await assert.rejects(() =>
        as(first, "password", () =>
          db.query(
            "select sis_mutate('profile','{\"display_name\":\"TESTE\"}', $1)",
            [crypto.randomUUID()],
          ),
        ),
      );
      await assert.rejects(() => as(second, "otp", () => begin(nonce)));
      await assert.rejects(() =>
        as(first, "password", () =>
          db.query(
            "insert into private.email_otp_sessions values($1,$2,'fake',now(),now()+interval '1 day')",
            [first, user],
          ),
        ),
      );
    },
  );
  await t.test(
    "sending is rate-limited and attempts are bound to the first session",
    async () => {
      await as(first, "password", () => begin(nonce));
      await assert.rejects(() => as(first, "password", () => begin(nonce)));
      assert.equal(await as(third, "oauth", () => attempt(nonce, id)), false);
      assert.equal(
        await as(first, "password", () => attempt("b".repeat(64), id)),
        false,
      );
      assert.equal(await as(first, "password", () => attempt(nonce, id)), true);
    },
  );
  await t.test(
    "wrong user, old OTP session, primary JWT and wrong nonce cannot complete",
    async () => {
      assert.equal(
        await as(foreign, "otp", () => complete(nonce, id), other),
        false,
      );
      assert.equal(
        await as(second, "otp", () => complete(nonce, id), user, 1),
        false,
      );
      assert.equal(
        await as(first, "password", () => complete(nonce, id)),
        false,
      );
      assert.equal(
        await as(second, "otp", () => complete("b".repeat(64), id)),
        false,
      );
    },
  );
  await t.test(
    "fresh OTP grants only the original session and cannot be replayed",
    async () => {
      assert.equal(await as(second, "otp", () => complete(nonce, id)), true);
      assert.equal((await as(first, "password", access)).verified, true);
      assert.equal((await as(second, "otp", access)).verified, false);
      assert.equal((await as(third, "oauth", access)).verified, false);
      assert.equal(await as(second, "otp", () => complete(nonce, id)), false);
    },
  );
  await t.test(
    "email changes and expired proofs invalidate step-up",
    async () => {
      await db.query(
        "update auth.users set email='changed@example.invalid' where id=$1",
        [user],
      );
      assert.equal((await as(first, "password", access)).verified, false);
      await db.query(
        "update auth.users set email=id::text||'@example.invalid' where id=$1",
        [user],
      );
      await db.exec(
        "update private.email_otp_sessions set expires_at=now()-interval '1 second'",
      );
      assert.equal((await as(first, "password", access)).verified, false);
    },
  );
  await t.test(
    "five attempts, expiration and session revocation cannot be bypassed",
    async () => {
      await db.exec("delete from private.rate_limits");
      await as(first, "password", () => begin(nonce));
      for (let n = 0; n < 5; n++)
        assert.equal(
          await as(first, "password", () =>
            attempt(nonce, crypto.randomUUID()),
          ),
          true,
        );
      assert.equal(
        await as(first, "password", () => attempt(nonce, crypto.randomUUID())),
        false,
      );
      await db.exec(
        "update private.email_otp_requests set expires_at=now()-interval '1 second'",
      );
      assert.equal(await as(second, "otp", () => complete(nonce, id)), false);
      await db.query("delete from auth.sessions where id=$1", [first]);
      assert.equal((await as(first, "password", access)).user_id, null);
    },
  );
  await t.test(
    "avatar paths are private and edition management is removed",
    async () => {
      await db.exec(
        "update private.auth_settings set email_otp_required=false",
      );
      await db.query(
        "insert into storage.objects(bucket_id,name) values('sis-avatars',$1),('sis-avatars',$2)",
        [user + "/avatar.webp", other + "/avatar.webp"],
      );
      const rows = await as(third, "oauth", () =>
        db.query(
          "select name from storage.objects where bucket_id='sis-avatars'",
        ),
      );
      assert.deepEqual(
        rows.rows.map((r) => r.name),
        [user + "/avatar.webp"],
      );
      await assert.rejects(() =>
        as(third, "oauth", () =>
          db.query("select sis_mutate('edition','{}',$1)", [
            crypto.randomUUID(),
          ]),
        ),
      );
    },
  );
  await db.close();
});
