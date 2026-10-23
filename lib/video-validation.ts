import { createFile, type Movie } from "mp4box";
import { HttpError } from "./http";
import { MAX_VIDEO_BYTES } from "./media-limits";

export function validateVideo(bytes: Buffer): Buffer {
  if (!bytes.length || bytes.length > MAX_VIDEO_BYTES)
    throw new HttpError(413, "O vídeo deve ter até 30 MB.");
  try {
    // Inspect the actual MP4 container, not the extension or browser MIME.
    if (bytes.toString("ascii", 4, 8) !== "ftyp") throw new Error("Not MP4");
    const parser = createFile();
    let info: Movie | undefined;
    parser.onReady = (movie) => {
      info = movie;
    };
    parser.onError = () => {
      throw new Error("Invalid MP4");
    };
    const buffer = Object.assign(Uint8Array.from(bytes).buffer, {
      fileStart: 0,
    });
    parser.appendBuffer(buffer);
    parser.flush();
    if (
      !info ||
      info.isFragmented ||
      !info.videoTracks.length ||
      info.tracks.length > 3
    )
      throw new Error("Invalid tracks");
    const durations = [
      info.duration / info.timescale,
      ...info.tracks.map((track) => track.duration / track.timescale),
    ];
    if (
      durations.some(
        (seconds) =>
          !Number.isFinite(seconds) || seconds <= 0,
      )
    )
      throw new Error("Invalid video duration");
    if (
      info.videoTracks.some((track) => !/^avc[13]\./.test(track.codec)) ||
      info.audioTracks.some((track) => !/^mp4a\.40\./.test(track.codec)) ||
      info.tracks.some((track) => !track.video && !track.audio) ||
      info.videoTracks.some(
        (track) =>
          !track.nb_samples ||
          !track.video?.width ||
          !track.video?.height ||
          track.video.width > 3840 ||
          track.video.height > 3840,
      )
    )
      throw new Error("Unsupported codec");
    for (const track of info.tracks) {
      const samples = parser.getTrackSamplesInfo(track.id);
      if (
        !samples.length ||
        samples.length !== track.nb_samples ||
        samples.some(
          (sample) =>
            !Number.isSafeInteger(sample.offset) ||
            !Number.isSafeInteger(sample.size) ||
            sample.offset < 0 ||
            sample.size <= 0 ||
            sample.offset + sample.size > bytes.length ||
            !Number.isFinite(sample.duration) ||
            sample.duration <= 0 ||
            !Number.isFinite(sample.cts),
        )
      )
        throw new Error("Incomplete video timeline");
    }
    return bytes;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(
      400,
      "Envie um vídeo MP4 válido (H.264, áudio AAC), com até 30 MB.",
    );
  }
}
