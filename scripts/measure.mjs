import { writeFile, mkdir } from "node:fs/promises";
const base = process.argv[2] || "http://127.0.0.1:3000";
const label = process.argv[3] || "measurement";
const pages = ["/", "/categoria/csnu", "/dossies"];
const result = {
  at: new Date().toISOString(),
  base,
  method:
    "1 warmup + 5 sequential GETs per route; full HTML; same local dev server and public database",
  pages: [],
};
for (const path of pages) {
  await fetch(base + path).then((r) => r.arrayBuffer());
  const samples = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    const r = await fetch(base + path);
    const headersMs = performance.now() - start;
    const body = await r.arrayBuffer();
    samples.push({
      status: r.status,
      headersMs: Math.round(headersMs),
      totalMs: Math.round(performance.now() - start),
      bytes: body.byteLength,
    });
  }
  result.pages.push({ path, samples });
}
await mkdir("docs/evidence", { recursive: true });
await writeFile(`docs/evidence/${label}.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
