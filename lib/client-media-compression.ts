import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "./media-limits";
import type { Conversion as MediaConversion } from "mediabunny";

export function fitMedia(
  width: number,
  height: number,
  maximum: number,
  even = false,
) {
  const scale = Math.min(1, maximum / Math.max(width, height));
  const dimension = (value: number) =>
    even
      ? Math.max(2, Math.floor((value * scale) / 2) * 2)
      : Math.max(1, Math.round(value * scale));
  return {
    width: dimension(width),
    height: dimension(height),
  };
}

type CompressionOptions = {
  signal: AbortSignal;
  onProgress: (message: string) => void;
};

async function compressImage(file: File, options: CompressionOptions) {
  const image = await createImageBitmap(file);
  try {
    options.signal.throwIfAborted();
    const size = fitMedia(image.width, image.height, 2560);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    try {
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, size.width, size.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.9),
      );
      if (!blob || blob.type !== "image/webp")
        throw new Error("WebP encoding unavailable");
      return new File([blob], "imagem.webp", { type: "image/webp" });
    } finally {
      canvas.width = canvas.height = 0;
    }
  } finally {
    image.close();
  }
}

async function compressVideo(file: File, options: CompressionOptions) {
  if (!("VideoEncoder" in globalThis) || !("VideoDecoder" in globalThis))
    throw new Error("Video encoding unavailable");
  const {
    Input,
    BlobSource,
    MP4,
    Output,
    Mp4OutputFormat,
    BufferTarget,
    Conversion,
    Quality,
  } = await import("mediabunny");
  const input = new Input({ source: new BlobSource(file), formats: [MP4] });
  let conversion: MediaConversion | undefined;
  const cancel = () => {
    void conversion?.cancel().catch(() => {});
  };
  try {
    options.signal.throwIfAborted();
    const track = await input.getPrimaryVideoTrack();
    // Avoid tone mapping HDR into SDR: keeping the original preserves its colors.
    if (!track || (await track.hasHighDynamicRange()))
      throw new Error("Preserve HDR original");
    const size = fitMedia(
      await track.getDisplayWidth(),
      await track.getDisplayHeight(),
      1920,
      true,
    );
    const target = new BufferTarget();
    const output = new Output({
      target,
      format: new Mp4OutputFormat({ fastStart: false }),
    });
    conversion = await Conversion.init({
      input,
      output,
      video: {
        ...size,
        fit: "contain",
        codec: "avc",
        quality: new Quality("high"),
      },
      // Existing AAC audio is copied without another lossy encode.
      audio: { codec: "aac" },
    });
    if (!conversion.isValid || conversion.discardedTracks.length)
      throw new Error("Preserve all audio and video tracks");
    options.signal.addEventListener("abort", cancel, { once: true });
    options.signal.throwIfAborted();
    conversion.onProgress = (progress) =>
      options.onProgress(
        `Comprimindo vídeo em alta qualidade: ${Math.min(99, Math.round(progress * 100))}%`,
      );
    // Stop work once the output can no longer improve on the original size.
    const stopMonitoring = target.on("write", ({ end }) => {
      if (end >= Math.min(file.size, MAX_VIDEO_BYTES)) cancel();
    });
    try {
      await conversion.execute();
    } finally {
      stopMonitoring();
    }
    if (!target.buffer) throw new Error("Video output unavailable");
    return new File([target.buffer], "video.mp4", { type: "video/mp4" });
  } finally {
    options.signal.removeEventListener("abort", cancel);
    if (conversion && conversion.state !== "done")
      await conversion.cancel().catch(() => {});
    input.dispose();
  }
}

export async function compressMedia(
  file: File,
  kind: "image" | "video",
  options: CompressionOptions,
) {
  const maximum = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (!file.size) throw new Error("O arquivo está vazio.");
  const checkFinalSize = (result: File) => {
    if (result.size > maximum)
      throw new Error(
        `Não foi possível reduzir o arquivo para o limite de ${kind === "image" ? "15" : "30"} MB. O resultado ainda está acima do limite; nenhum arquivo foi enviado. Tente exportar em uma qualidade ou resolução menor.`,
      );
  };
  options.signal.throwIfAborted();
  options.onProgress(
    kind === "image"
      ? "Comprimindo imagem em alta qualidade…"
      : "Preparando compressão do vídeo…",
  );
  let result: File;
  try {
    result =
      kind === "image"
        ? await compressImage(file, options)
        : await compressVideo(file, options);
  } catch {
    options.signal.throwIfAborted();
    checkFinalSize(file);
    return {
      file,
      notice:
        "Original mantido: não foi possível comprimir neste aparelho sem alterar o conteúdo.",
    };
  }
  options.signal.throwIfAborted();
  if (!result.size || result.size >= file.size) {
    checkFinalSize(file);
    return {
      file,
      notice: "Original mantido: a compressão não reduziu o tamanho.",
    };
  }
  checkFinalSize(result);
  const formatSize = (bytes: number) =>
    `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return {
    file: result,
    notice: `Arquivo comprimido: ${formatSize(file.size)} → ${formatSize(result.size)} (${Math.round((1 - result.size / file.size) * 100)}% menor).`,
  };
}
