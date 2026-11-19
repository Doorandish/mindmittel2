'use client';

const ALLOWED_LOGO_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

/**
 * Validates and compresses a selected PNG/JPEG/WEBP logo file into a crisp max-256x256 PNG Data URI
 * suitable for storing directly in MongoDB without bloating database documents.
 */
export async function readAndResizeCompanyLogo(file: File): Promise<string> {
  if (!ALLOWED_LOGO_MIME_TYPES.has(file.type.toLowerCase())) {
    throw new Error(
      'Invalid logo format. Please upload a PNG, JPEG, or WEBP image (SVG is blocked for security).'
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image file must be under 5 MB before resizing.');
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not decode image file.'));
    image.src = rawDataUrl;
  });

  const MAX_DIM = 256;
  let width = img.width || MAX_DIM;
  let height = img.height || MAX_DIM;

  if (width > MAX_DIM || height > MAX_DIM) {
    const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
    width = Math.max(1, Math.round(width * ratio));
    height = Math.max(1, Math.round(height * ratio));
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return rawDataUrl;
  }

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const compressedPng = canvas.toDataURL('image/png');
  if (compressedPng.length <= 340_000) {
    return compressedPng;
  }
  return canvas.toDataURL('image/webp', 0.88);
}
