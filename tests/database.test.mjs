import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("Migration and direct API security on isolated PostgreSQL", async (t) => {
  const db = new PGlite();
  await db.exec(await readFile("tests/bootstrap.sql", "utf8"));
  await db.exec(
    await readFile(
      "supabase/migrations/20260905140355_sis_foundation.sql",
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      "supabase/migrations/20260905140644_sis_policy_indexes.sql",
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      "supabase/migrations/20260905214706_email_otp_access.sql",
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      "supabase/migrations/20260908120000_article_delete.sql",
      "utf8",
    ),
  );
  const uid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const admin = uid(1),
    reader = uid(4),
    journalist = uid(5),
    moderator = uid(6),
    unverified = uid(7),
    editor = uid(8);
  for (const n of [1, 4, 5, 6, 7, 8]) {
    await db.query(
      "insert into auth.users(id,email_confirmed_at) values($1,$2) on conflict do nothing",
      [uid(n), n === 7 ? null : new Date().toISOString()],
    );
    await db.query("insert into auth.sessions values($1,$2)", [
      uid(100 + n),
      uid(n),
    ]);
  }
  await db.query(
    "insert into private.user_roles(user_id,role) values($1,'journalist'),($2,'moderator'),($3,'editor')",
    [journalist, moderator, editor],
  );
  const as = async (user, fn) => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claims',$1,false)", [
      user
        ? JSON.stringify({
            sub: user,
            amr: [
              { method: "password", timestamp: Math.floor(Date.now() / 1000) },
            ],
            session_id: uid(100 + Number(user.slice(-12))),
            user_metadata: { role: "admin" },
          })
        : "{}",
    ]);
    await db.exec(user ? "set role authenticated" : "set role anon");
    try {
      return await fn();
    } finally {
      await db.exec("reset role");
    }
  };
  const mutate = async (user, act, d, op = crypto.randomUUID()) =>
    as(
      user,
      async () =>
        (
          await db.query("select public.sis_mutate($1,$2,$3) result", [
            act,
            d,
            op,
          ])
        ).rows[0].result,
    );
  const denied = async (fn) => assert.rejects(fn);
  const edition = (await db.query("select id from editions where slug='2026'"))
    .rows[0].id;
  const draft = {
    slug: "teste-isolado-acao",
    title: "TESTE ISOLADO: Ação diplomática",
    subtitle: "Negociação e cooperação",
    category: "csnu",
    author: "Equipe fictícia",
    edition_id: edition,
    content: { paragraphs: ["Uma negociação diplomática da simulação."] },
    status: "draft",
    kind: "simulation",
    tags: ["diplomacia"],
  };
  let article, second, comment;
  await t.test(
    "legacy administrators preserved; forged metadata gives reader no role",
    async () => {
      assert.equal(
        (
          await db.query(
            "select count(*)::int n from private.user_roles where role='admin'",
          )
        ).rows[0].n,
        3,
      );
      const access = await as(
        reader,
        async () => (await db.query("select sis_access() a")).rows[0].a,
      );
      assert.deepEqual(access.roles, []);
      await denied(() =>
        mutate(reader, "role", { user_id: reader, role: "admin", grant: true }),
      );
      await denied(() =>
        mutate(admin, "role", { user_id: admin, role: "editor", grant: true }),
      );
    },
  );
  await t.test(
    "direct writes to articles, roles, storage and moderation are denied",
    async () => {
      for (const sql of [
        "update public.articles set title='abuso'",
        "insert into private.user_roles values('" +
          reader +
          "','admin',null,now())",
        "insert into storage.objects(bucket_id,name) values('article-images','abuso.svg')",
        "update public.comments set status='approved'",
        "truncate public.articles",
      ]) {
        await denied(() => as(reader, () => db.exec(sql)));
      }
      await denied(() => mutate(null, "comment.create", {}));
      await denied(() => mutate(reader, "article.save", draft));
      await denied(() => mutate(moderator, "article.save", draft));
    },
  );
  await t.test(
    "journalist owns drafts; only editor publishes; optimistic locking",
    async () => {
      article = await mutate(journalist, "article.save", draft);
      assert.equal(
        (await as(null, () => db.query("select id from articles"))).rows.length,
        0,
      );
      assert.equal(
        (await as(reader, () => db.query("select * from sis_search('ação')")))
          .rows.length,
        0,
      );
      await denied(() =>
        mutate(journalist, "article.save", {
          ...draft,
          ...article,
          status: "published",
        }),
      );
      await denied(() =>
        mutate(editor, "article.save", {
          ...draft,
          ...article,
          version: 0,
          status: "published",
        }),
      );
      article = await mutate(editor, "article.save", {
        ...draft,
        ...article,
        status: "published",
      });
      assert.equal(
        (await as(null, () => db.query("select id from articles"))).rows.length,
        1,
      );
      second = await mutate(editor, "article.save", {
        ...draft,
        slug: "teste-isolado-2",
        status: "published",
      });
    },
  );
  await t.test(
    "Portuguese search, combined filters and pagination",
    async () => {
      const found = await as(null, () =>
        db.query("select * from sis_search('ação','csnu',null,null,null,1,1)"),
      );
      assert.equal(
        (await as(null, () => db.query("select * from sis_search('acao')")))
          .rows.length,
        2,
      );
      assert.equal(found.rows.length, 1);
      assert.equal(Number(found.rows[0].total), 2);
      assert.equal(
        (
          await as(null, () =>
            db.query("select * from sis_search('ação','juridico')"),
          )
        ).rows.length,
        0,
      );
      assert.equal(
        (
          await as(null, () =>
            db.query(
              "select * from sis_search('ação','csnu',null,null,null,2,1)",
            ),
          )
        ).rows.length,
        1,
      );
    },
  );
  await t.test(
    "comments closed until explicit operation configuration",
    async () => {
      await mutate(reader, "profile", { display_name: "Leitor fictício" });
      await denied(() =>
        mutate(reader, "comment.create", {
          article_id: article.id,
          body: "Comentário de teste",
        }),
      );
      await mutate(admin, "settings", {
        comments_enabled: true,
        moderation_ready: true,
        premoderation: true,
        readers_enabled: true,
      });
      await denied(() =>
        mutate(unverified, "profile", { display_name: "Sem verificação" }),
      );
    },
  );
  await t.test(
    "pending is private; retry is idempotent; only moderator approves",
    async () => {
      const op = crypto.randomUUID();
      comment = await mutate(
        reader,
        "comment.create",
        { article_id: article.id, body: "Comentário fictício pendente" },
        op,
      );
      assert.deepEqual(
        comment,
        await mutate(
          reader,
          "comment.create",
          { article_id: article.id, body: "Comentário fictício pendente" },
          op,
        ),
      );
      assert.equal(
        (await as(null, () => db.query("select id,body from comments"))).rows
          .length,
        0,
      );
      assert.equal(
        (await as(reader, () => db.query("select id from comments"))).rows
          .length,
        1,
      );
      await denied(() =>
        mutate(reader, "moderate", {
          id: comment.id,
          version: 1,
          decision: "approve",
          reason: "Tentativa",
        }),
      );
      await mutate(moderator, "moderate", {
        id: comment.id,
        version: 1,
        decision: "approve",
        reason: "Adequado às regras",
      });
      assert.equal(
        (await as(null, () => db.query("select id,body from comments"))).rows
          .length,
        1,
      );
      await denied(() =>
        as(null, () => db.query("select author_id from comments")),
      );
    },
  );
  await t.test(
    "cross-article replies rejected; editing returns to review",
    async () => {
      await denied(() =>
        mutate(reader, "comment.create", {
          article_id: second.id,
          parent_id: comment.id,
          body: "Resposta errada",
        }),
      );
      const reply = await mutate(reader, "comment.create", {
        article_id: article.id,
        parent_id: comment.id,
        body: "Resposta fictícia",
      });
      await mutate(moderator, "moderate", {
        id: reply.id,
        version: 1,
        decision: "approve",
        reason: "Resposta adequada",
      });
      await denied(() =>
        mutate(reader, "comment.create", {
          article_id: article.id,
          parent_id: reply.id,
          body: "Terceiro nível",
        }),
      );
      await mutate(reader, "comment.edit", {
        id: comment.id,
        version: 2,
        body: "Texto revisado",
      });
      assert.equal(
        (
          await as(null, () =>
            db.query("select id from comments where id=$1", [comment.id]),
          )
        ).rows.length,
        0,
      );
      await mutate(reader, "comment.remove", { id: comment.id, version: 3 });
      assert.equal(
        (await db.query("select body from comments where id=$1", [comment.id]))
          .rows[0].body,
        "",
      );
    },
  );
  await t.test(
    "persistent quota, moderation context and role separation",
    async () => {
      for (let i = 0; i < 3; i++)
        await mutate(reader, "comment.create", {
          article_id: article.id,
          body: `Teste isolado ${i}`,
        });
      await denied(() =>
        mutate(reader, "comment.create", {
          article_id: article.id,
          body: "Acima do limite",
        }),
      );
      await denied(() => mutate(reader, "upload.reserve", {}));
      for (let i = 0; i < 15; i++)
        await mutate(journalist, "upload.reserve", {});
      await denied(() => mutate(journalist, "upload.reserve", {}));
      assert.ok(
        (
          await as(moderator, () =>
            db.query("select sis_dashboard('pending') q"),
          )
        ).rows[0].q.length > 0,
      );
      await denied(() =>
        as(reader, () => db.query("select sis_dashboard('pending')")),
      );
      await denied(() =>
        as(moderator, () => db.query("select sis_dashboard('corrections')")),
      );
    },
  );
  await t.test(
    "slug redirects retained; archived articles removed from public queries",
    async () => {
      article = await mutate(editor, "article.save", {
        ...draft,
        ...article,
        slug: "teste-isolado-corrigido",
        status: "published",
      });
      assert.equal(
        (await as(null, () => db.query("select slug from article_slugs")))
          .rows[0].slug,
        draft.slug,
      );
      await mutate(editor, "article.save", {
        ...draft,
        ...article,
        slug: "teste-isolado-corrigido",
        status: "archived",
      });
      assert.equal(
        (
          await as(null, () =>
            db.query("select id from articles where id=$1", [article.id]),
          )
        ).rows.length,
        0,
      );
      assert.equal(
        (await as(null, () => db.query("select slug from article_slugs"))).rows
          .length,
        0,
      );
    },
  );
  await t.test(
    "private locations and files stay private; confirmed resolutions required",
    async () => {
      const session = await mutate(editor, "session", {
        edition_id: edition,
        category: "csnu",
        title: "TESTE ISOLADO sessão",
        starts_at: "2026-09-20T12:00:00-03:00",
        ends_at: "2026-09-20T13:00:00-03:00",
        location: "Local restrito",
        published: true,
      });
      await denied(() =>
        as(null, () => db.query("select location from sessions")),
      );
      assert.equal(
        (
          await as(null, () =>
            db.query("select sis_public_location($1) location", [session.id]),
          )
        ).rows[0].location,
        null,
      );
      await denied(() =>
        mutate(editor, "update", {
          session_id: session.id,
          body: "Resultado não confirmado",
          author: "Equipe fictícia",
          result: true,
          organization_confirmed: false,
          published: true,
        }),
      );
      const asset = crypto.randomUUID();
      await db.query(
        "insert into media_assets(id,owner_id,bucket,path,mime,bytes) values($1,$2,'sis-documents','teste.pdf','application/pdf',100)",
        [asset, editor],
      );
      await mutate(editor, "document", {
        edition_id: edition,
        title: "TESTE ISOLADO guia",
        kind: "guide",
        document_version: "1",
        responsible: "Equipe fictícia",
        asset_id: asset,
        audience: "restricted",
        published: true,
      });
      assert.equal(
        (await as(null, () => db.query("select id from documents"))).rows
          .length,
        0,
      );
      assert.equal(
        (await as(null, () => db.query("select id from media_assets"))).rows
          .length,
        0,
      );
    },
  );
  await t.test(
    "article deletion checks ownership, confirmation and version",
    async () => {
      const ownDraft = await mutate(journalist, "article.save", {
        ...draft,
        slug: "rascunho-para-apagar",
        title: "TESTE ISOLADO: Rascunho descartável",
      });
      await denied(() =>
        mutate(reader, "article.delete", {
          ...ownDraft,
          confirmation: "TESTE ISOLADO: Rascunho descartável",
        }),
      );
      await denied(() =>
        mutate(journalist, "article.delete", {
          ...ownDraft,
          confirmation: "Título incorreto",
        }),
      );
      const deleteOperation = crypto.randomUUID();
      const deleted = await mutate(
        journalist,
        "article.delete",
        {
          ...ownDraft,
          confirmation: "TESTE ISOLADO: Rascunho descartável",
        },
        deleteOperation,
      );
      assert.deepEqual(
        deleted,
        await mutate(
          journalist,
          "article.delete",
          {
            ...ownDraft,
            confirmation: "TESTE ISOLADO: Rascunho descartável",
          },
          deleteOperation,
        ),
      );
      const target = (
        await db.query("select id,title,version from articles where id=$1", [
          article.id,
        ])
      ).rows[0];
      await denied(() =>
        mutate(journalist, "article.delete", {
          ...target,
          confirmation: target.title,
        }),
      );
      await mutate(editor, "article.delete", {
        ...target,
        confirmation: target.title,
      });
      assert.equal(
        (
          await db.query(
            "select count(*)::int n from comments where article_id=$1",
            [article.id],
          )
        ).rows[0].n,
        0,
      );
      assert.equal(
        (
          await db.query(
            "select count(*)::int n from private.audit_log where action='article.delete'",
          )
        ).rows[0].n,
        2,
      );
    },
  );
  await t.test(
    "account export is scoped; erasure clears contributions; revoked sessions are rejected",
    async () => {
      await mutate(reader, "bookmark", { article_id: second.id, saved: true });
      const exported = await as(
        reader,
        async () =>
          (await db.query("select sis_account_export() result")).rows[0].result,
      );
      assert.equal(exported.profile.display_name, "Leitor fictício");
      assert.equal(exported.bookmarks.length, 1);
      await denied(() =>
        mutate(reader, "account.erase", { confirmation: "wrong" }),
      );
      await mutate(reader, "account.erase", {
        confirmation: "APAGAR MINHAS CONTRIBUIÇÕES",
      });
      assert.equal(
        (
          await db.query(
            "select count(*)::int n from comments where author_id=$1",
            [reader],
          )
        ).rows[0].n,
        0,
      );
      assert.equal(
        (
          await db.query(
            "select count(*)::int n from bookmarks where user_id=$1",
            [reader],
          )
        ).rows[0].n,
        0,
      );
      await db.query("delete from auth.sessions where user_id=$1", [
        journalist,
      ]);
      const access = await as(
        journalist,
        async () => (await db.query("select sis_access() a")).rows[0].a,
      );
      assert.equal(access.user_id, null);
      await denied(() =>
        mutate(journalist, "profile", { display_name: "Sessão encerrada" }),
      );
      await denied(() =>
        mutate(journalist, "article.save", { ...draft, slug: "sem-sessao" }),
      );
    },
  );
  await db.close();
});
