import { toPng, toBlob } from 'html-to-image';

/**
 * Render a DOM element to a PNG blob.
 */
export async function renderCardToBlob(element: HTMLElement): Promise<Blob> {
  const blob = await toBlob(element, {
    pixelRatio: 2,
  });
  if (!blob) throw new Error('Failed to render card');
  return blob;
}

/**
 * Render a DOM element to a PNG data URL.
 */
export async function renderCardToDataUrl(element: HTMLElement): Promise<string> {
  return toPng(element, {
    pixelRatio: 2,
  });
}

/**
 * Trigger a file download in the browser.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Share via Web Share API. Returns false if not supported.
 */
export async function shareImage(blob: Blob, title: string): Promise<boolean> {
  if (!navigator.share || !navigator.canShare) return false;

  const file = new File([blob], 'chrono-card.png', { type: 'image/png' });

  if (!navigator.canShare({ files: [file] })) return false;

  try {
    await navigator.share({
      title,
      files: [file],
    });
    return true;
  } catch {
    return false;
  }
}
