import { MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS } from "./media-limits";

export async function validateClientVideo(file: File) {
  if (file.size > MAX_VIDEO_BYTES)
    throw new Error("O vídeo deve ter até 30 MB.");
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  try {
    const duration = await new Promise<number>((resolve, reject) => {
      const timer = setTimeout(
        () =>
          reject(
            new Error(
              "Não foi possível verificar o vídeo. Envie um MP4 válido.",
            ),
          ),
        10000,
      );
      video.onloadedmetadata = () => {
        clearTimeout(timer);
        resolve(video.duration);
      };
      video.onerror = () => {
        clearTimeout(timer);
        reject(
          new Error(
            "O navegador não conseguiu abrir o vídeo. Envie MP4 (H.264).",
          ),
        );
      };
      video.src = url;
    });
    if (
      !Number.isFinite(duration) ||
      duration <= 0 ||
      duration > MAX_VIDEO_SECONDS
    )
      throw new Error("O vídeo deve ter no máximo 30 segundos.");
  } finally {
    video.onloadedmetadata = null;
    video.onerror = null;
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
