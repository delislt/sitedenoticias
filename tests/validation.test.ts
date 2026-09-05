import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { PDFDocument, PDFName, PDFString } from "pdf-lib";
import {
  validateImage,
  validatePdf,
  MAX_FILE_BYTES,
} from "../lib/upload-validation";
import { sameOrigin, boundedJson } from "../lib/http";
import { safeReturn, readingMinutes, calendarDate } from "../lib/domain";
import { calendar } from "../lib/ics";
test("image upload decodes and re-encodes legitimate bytes; rejects active and oversized content", async () => {
  const png = await sharp({
    create: { width: 32, height: 24, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  const clean = await validateImage(png);
  assert.equal((await sharp(clean).metadata()).format, "webp");
  await assert.rejects(() =>
    validateImage(
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      ),
    ),
  );
  await assert.rejects(() =>
    validateImage(Buffer.from("<html>Not an image</html>")),
  );
  await assert.rejects(() => validateImage(Buffer.alloc(MAX_FILE_BYTES + 1)));
  const wide = await sharp({
    create: { width: 6001, height: 1, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  await assert.rejects(() => validateImage(wide));
});
test("PDF allows passive pages; rejects scripts regardless of declared MIME", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  const valid = await validatePdf(Buffer.from(await pdf.save()));
  assert.equal((await PDFDocument.load(valid)).getPageCount(), 1);
  pdf.catalog.set(
    PDFName.of("OpenAction"),
    pdf.context.obj({ S: "JavaScript", JS: PDFString.of("app.alert(1)") }),
  );
  const active = Buffer.from(await pdf.save());
  await assert.rejects(() => validatePdf(active));
  await assert.rejects(() => validatePdf(Buffer.from("<html>fake.pdf</html>")));
});
test("CSRF and bounded request body; no external return destinations", async () => {
  assert.throws(() =>
    sameOrigin(
      new Request("https://sisnoticias.vercel.app/api/actions", {
        headers: { origin: "https://evil.example" },
      }),
    ),
  );
  assert.throws(() =>
    sameOrigin(new Request("https://sisnoticias.vercel.app/api/actions")),
  );
  sameOrigin(
    new Request("https://sisnoticias.vercel.app/api/actions", {
      headers: { origin: "https://sisnoticias.vercel.app" },
    }),
  );
  await assert.rejects(() =>
    boundedJson(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ s: "a".repeat(100) }),
      }),
      20,
    ),
  );
  assert.equal(safeReturn("//evil.example"), "/");
  assert.equal(safeReturn("/\\evil.example"), "/");
  assert.equal(safeReturn("/artigo/teste"), "/artigo/teste");
  assert.equal(safeReturn("/%2f%2fevil.example"), "/");
  assert.equal(safeReturn("/%255cevil.example"), "/");
  assert.equal(calendarDate("2026-99-99"), "");
  assert.equal(calendarDate("2026-02-30"), "");
  assert.equal(calendarDate("2026-09-05"), "2026-09-05");
});
test("ICS preserves Sao Paulo time and escapes injection", () => {
  const text = calendar(
    [
      {
        id: "test",
        title: "Sessão, teste\nEND:VEVENT",
        starts_at: "2026-09-20T12:00:00-03:00",
        ends_at: "2026-09-20T13:00:00-03:00",
        updated_at: "2026-09-01T00:00:00Z",
        status: "scheduled",
      },
    ],
    "https://sisnoticias.vercel.app",
  );
  assert.match(text, /DTSTART:20260920T150000Z/);
  assert.match(text, /X-WR-TIMEZONE:America\/Sao_Paulo/);
  assert.equal(text.split("\r\nEND:VEVENT").length, 2);
  assert.match(text, /Sessão\\, teste\\nEND:VEVENT/);
  assert.equal(readingMinutes(["palavra ".repeat(401)]), 3);
});
