import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateVideo } from "../lib/video-validation";
import { MAX_VIDEO_BYTES } from "../lib/media-limits";
import { issueUploadTicket, verifyUploadTicket } from "../lib/upload-ticket";
import { validateClientVideo } from "../lib/client-video";

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

for (const tag of ["hvc1", "hev1"]) {
  test(`real HEVC MP4 (${tag}) is accepted, including without browser decoding`, async () => {
    const bytes = Buffer.from(
      readFileSync(new URL(`./fixtures/video-hevc-${tag}.mp4.b64`, import.meta.url), "utf8"),
      "base64",
    );
    assert.equal(validateVideo(bytes), bytes);
    await validateClientVideo(new File([bytes], "hevc.mp4", { type: "video/mp4" }));
    assert.throws(() => validateVideo(bytes.subarray(0, bytes.length - 10)), /MP4 válido/);
  });
}

test("client rejects empty and oversized video before uploading", async () => {
  await assert.rejects(validateClientVideo(new File([], "empty.mp4")), /vazio/);
  await assert.rejects(
    validateClientVideo(new File([new Uint8Array(MAX_VIDEO_BYTES + 1)], "large.mp4")),
    /30 MB/,
  );
});

test("server accepts a clip longer than 30 seconds below the size limit", () => {
  assert.ok(clip(31).length < MAX_VIDEO_BYTES);
  const bytes = clip(31);
  assert.equal(validateVideo(bytes), bytes);
});

test("server rejects oversized, renamed non-video and truncated MP4 files", () => {
  assert.throws(
    () => validateVideo(Buffer.alloc(MAX_VIDEO_BYTES + 1)),
    /30 MB/,
  );
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

test("valid MP4 over the function payload limit and exactly 30 MB is accepted", () => {
  const original = clip(30);
  const padding = Buffer.alloc(MAX_VIDEO_BYTES - original.length);
  padding.writeUInt32BE(padding.length, 0);
  padding.write("free", 4, "ascii");
  const bytes = Buffer.concat([original, padding]);
  assert.equal(bytes.length, 30 * 1024 * 1024);
  assert.equal(validateVideo(bytes), bytes);
});

test("upload authorization binds the temporary file to its owner and expires", () => {
  const id = "11111111-1111-4111-8111-111111111111";
  const owner = "22222222-2222-4222-8222-222222222222";
  const key = "isolated-test-key";
  const ticket = issueUploadTicket(id, owner, "video", key, 1000);
  assert.equal(verifyUploadTicket(ticket, owner, key, 1001).id, id);
  assert.equal(verifyUploadTicket(ticket, owner, key, 1001).kind, "video");
  assert.throws(() => verifyUploadTicket(ticket, id, key, 1001), /inválida/);
  assert.throws(
    () => verifyUploadTicket(ticket, owner, "wrong-key", 1001),
    /inválida/,
  );
  assert.throws(
    () => verifyUploadTicket(ticket + "tampered", owner, key, 1001),
    /inválida/,
  );
  assert.throws(
    () => verifyUploadTicket(ticket, owner, key, 1000 + 7200000),
    /expirada/,
  );
});
