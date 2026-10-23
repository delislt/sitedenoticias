import test from "node:test";
import assert from "node:assert/strict";
import { compressMedia, fitMedia } from "../lib/client-media-compression";
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "../lib/media-limits";

test("resizing preserves portrait/landscape proportions without enlarging small images", () => {
  assert.deepEqual(fitMedia(4000, 3000, 2560), { width: 2560, height: 1920 });
  assert.deepEqual(fitMedia(2160, 3840, 1920, true), {
    width: 1080,
    height: 1920,
  });
  assert.deepEqual(fitMedia(31, 17, 2560), { width: 31, height: 17 });
});

test("images above 15 MB are compressed before the limit is checked; larger final output is blocked", async () => {
  let encodedSize = 1024;
  let closed = false;
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      drawImage() {},
      imageSmoothingEnabled: false,
      imageSmoothingQuality: "low",
    }),
    toBlob: (callback: (blob: Blob) => void) =>
      callback(new Blob([new Uint8Array(encodedSize)], { type: "image/webp" })),
  };
  const previousBitmap = Object.getOwnPropertyDescriptor(
    globalThis,
    "createImageBitmap",
  );
  Object.defineProperty(globalThis, "createImageBitmap", {
    configurable: true,
    value: async () => ({
      width: 8000,
      height: 6000,
      close() {
        closed = true;
      },
    }),
  });
  // Node has no canvas APIs. Install only this test's browser surface.
  const previousDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { createElement: () => canvas },
  });
  try {
    const original = new File(
      [new Uint8Array(MAX_IMAGE_BYTES + 2048)],
      "large.jpg",
      { type: "image/jpeg" },
    );
    const options = { signal: new AbortController().signal, onProgress() {} };
    const result = await compressMedia(original, "image", options);
    assert.equal(result.file.size, 1024);
    assert.match(result.notice, /menor/);
    assert.equal(closed, true);
    assert.equal(canvas.width, 0);
    encodedSize = MAX_IMAGE_BYTES + 1;
    await assert.rejects(
      compressMedia(original, "image", options),
      /resultado ainda está acima/,
    );
    encodedSize = original.size + 1;
    await assert.rejects(
      compressMedia(original, "image", options),
      /nenhum arquivo foi enviado/,
    );
  } finally {
    if (previousBitmap)
      Object.defineProperty(globalThis, "createImageBitmap", previousBitmap);
    else Reflect.deleteProperty(globalThis, "createImageBitmap");
    if (previousDocument)
      Object.defineProperty(globalThis, "document", previousDocument);
    else Reflect.deleteProperty(globalThis, "document");
  }
});

test("unsupported browser preserves videos within the limit but rejects oversized results after trying compression", async () => {
  const options = { signal: new AbortController().signal, onProgress() {} };
  const original = new File(["video"], "original.mp4", { type: "video/mp4" });
  assert.equal(
    (await compressMedia(original, "video", options)).file,
    original,
  );
  await assert.rejects(
    compressMedia(
      new File([new Uint8Array(MAX_VIDEO_BYTES + 1)], "large.mp4"),
      "video",
      options,
    ),
    /30 MB/,
  );
});

test("canceling compression does not fall back to sending the original", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    compressMedia(new File(["video"], "video.mp4"), "video", {
      signal: controller.signal,
      onProgress() {},
    }),
    { name: "AbortError" },
  );
});
