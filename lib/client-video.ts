import { MAX_VIDEO_BYTES } from "./media-limits";

export async function validateClientVideo(file: File) {
  if (!file.size) throw new Error("O arquivo de vídeo está vazio.");
  if (file.size > MAX_VIDEO_BYTES)
    throw new Error("O vídeo deve ter até 30 MB.");
  // The server inspects the container, codecs and complete sample data.
  // Browser decoding support must not prevent uploading a valid HEVC file.
}
