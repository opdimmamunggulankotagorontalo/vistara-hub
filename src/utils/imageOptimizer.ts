import { formatBytesReadable } from './adminAuth';

export interface ScaledDimensions {
  width: number;
  height: number;
  resized: boolean;
}

export interface OptimizedWebpResult {
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  originalSizeText: string;
  compressedSizeText: string;
}

/**
 * Computes proportional dimensions bounded by maxWidth x maxHeight (default 1920x1080 Full HD / 1080p)
 * without upscaling images that are already smaller.
 */
export function calculate1080pDimensions(
  srcWidth: number,
  srcHeight: number,
  maxWidth = 1920,
  maxHeight = 1080
): ScaledDimensions {
  const safeW = Math.max(1, Math.round(srcWidth));
  const safeH = Math.max(1, Math.round(srcHeight));

  if (safeW <= maxWidth && safeH <= maxHeight) {
    return { width: safeW, height: safeH, resized: false };
  }

  const ratio = Math.min(maxWidth / safeW, maxHeight / safeH);
  return {
    width: Math.max(1, Math.round(safeW * ratio)),
    height: Math.max(1, Math.round(safeH * ratio)),
    resized: true,
  };
}

export async function convertImageToWebp1080p(
  file: File,
  quality = 0.82
): Promise<OptimizedWebpResult> {
  const imageUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Gagal membaca file gambar untuk dikonversi.'));
      el.src = imageUrl;
    });

    const { width, height } = calculate1080pDimensions(img.naturalWidth, img.naturalHeight, 1920, 1080);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas tidak tersedia di browser.');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error('Konversi gambar ke WebP gagal.'));
        },
        'image/webp',
        quality
      );
    });

    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-');
    const fileName = `${baseName || 'image'}-${Date.now()}.webp`;

    return {
      blob,
      fileName,
      width,
      height,
      originalSize: file.size,
      compressedSize: blob.size,
      originalSizeText: formatBytesReadable(file.size),
      compressedSizeText: formatBytesReadable(blob.size),
    };
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Gagal membaca data berkas.'));
    reader.readAsDataURL(blob);
  });
}
