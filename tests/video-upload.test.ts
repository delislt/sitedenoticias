import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateVideo } from "../lib/video-validation";
import { MAX_VIDEO_BYTES } from "../lib/media-limits";

const clip = (seconds: number) =>
  Buffer.from(
    readFileSync(
      new URL(`./fixtures/video-${seconds}s.mp4.b64`, import.meta.url),
      "utf8",
    ),
    "base64",
  );

test("real MP4 at 30 seconds is accepted without altering its bytes", () => {
  const bytes = clip(30);
  assert.equal(validateVideo(bytes), bytes);
});

test("server rejects a 31-second clip even when below the size limit", () => {
  assert.ok(clip(31).length < MAX_VIDEO_BYTES);
  assert.throws(() => validateVideo(clip(31)), /30 segundos/);
});

test("server rejects oversized, renamed non-video and truncated MP4 files", () => {
  assert.throws(() => validateVideo(Buffer.alloc(MAX_VIDEO_BYTES + 1)), /4 MB/);
  assert.throws(
    () => validateVideo(Buffer.from("<html>fake video.mp4</html>")),
    /MP4 válido/,
  );
  const bytes = clip(30);
  assert.throws(
    () => validateVideo(bytes.subarray(0, bytes.length - 100)),
    /MP4 válido/,
  );
});
