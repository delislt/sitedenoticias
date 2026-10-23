import test from "node:test";
import assert from "node:assert/strict";
import { command, readApi } from "../lib/client-api";

test("lost save response retries with the same operation and payload", async (t) => {
  const bodies: string[] = [];
  t.mock.method(
    globalThis,
    "fetch",
    async (_url: string, init: RequestInit) => {
      bodies.push(String(init.body));
      if (bodies.length === 1) throw new TypeError("Failed to fetch");
      return Response.json({ id: "saved", version: 2 });
    },
  );
  const saved = await command("article.save", { title: "Matéria" }, "same-key");
  assert.deepEqual(saved, { id: "saved", version: 2 });
  assert.equal(bodies.length, 2);
  assert.equal(bodies[0], bodies[1]);
  assert.equal(JSON.parse(bodies[0]).operation, "same-key");
});

test("validation, conflict and session errors are not retried", async (t) => {
  for (const status of [400, 401, 403, 409, 413]) {
    const mocked = t.mock.method(globalThis, "fetch", async () =>
      Response.json({ error: "Recusado" }, { status }),
    );
    await assert.rejects(command("article.save", {}, "same-key"), /Recusado/);
    assert.equal(mocked.mock.callCount(), 1);
    mocked.mock.restore();
  }
});

test("temporary read outage recovers; persistent network failure is explained", async (t) => {
  let calls = 0;
  const mocked = t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return calls === 1
      ? new Response("Gateway error", { status: 502 })
      : Response.json({ items: [] });
  });
  assert.deepEqual(await readApi("/api/admin/articles"), { items: [] });
  assert.equal(calls, 2);
  mocked.mock.restore();
  const failed = t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("Failed to fetch");
  });
  await assert.rejects(
    command("article.save", {}, "same-key"),
    /Falha de conexão/,
  );
  assert.equal(failed.mock.callCount(), 2);
});

test("aborted reads and non-idempotent commands are not repeated", async (t) => {
  const controller = new AbortController();
  controller.abort();
  const mocked = t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("Failed to fetch");
  });
  await assert.rejects(readApi("/api/admin/articles", controller.signal));
  await assert.rejects(
    command("comment.create", {}, "key"),
    /Falha de conexão/,
  );
  assert.equal(mocked.mock.callCount(), 2);
});
