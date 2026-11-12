import { WatermarkConfig } from '../types';

export const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  enabled: true,
  text: 'KYRON.AI',
  placement: 'bottom-right',
  opacity: 0.85,
  style: 'subtle',
  fontSize: 16,
};

/**
 * Draws the official KYRON.AI brand watermark onto a 2D canvas context.
 */
export function drawWatermarkOnCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: WatermarkConfig = DEFAULT_WATERMARK_CONFIG
) {
  if (!config.enabled) return;

  ctx.save();

  const text = config.text || 'KYRON.AI';
  const fontSize = Math.max(12, Math.min(28, Math.round(width * 0.016)));
  ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;

  const textMetrics = ctx.measureText(text);
  const paddingX = 14;
  const paddingY = 8;
  const badgeWidth = textMetrics.width + paddingX * 2 + 18; // 18px for brand dot
  const badgeHeight = fontSize + paddingY * 2;

  let x = width - badgeWidth - 24;
  let y = height - badgeHeight - 24;

  if (config.placement === 'bottom-left') {
    x = 24;
    y = height - badgeHeight - 24;
  } else if (config.placement === 'top-right') {
    x = width - badgeWidth - 24;
    y = 24;
  } else if (config.placement === 'top-left') {
    x = 24;
    y = 24;
  } else if (config.placement === 'center') {
    x = (width - badgeWidth) / 2;
    y = (height - badgeHeight) / 2;
  }

  // Draw translucent backdrop pill
  ctx.globalAlpha = Math.min(1, Math.max(0.1, config.opacity));
  ctx.fillStyle = config.style === 'visible' ? 'rgba(8, 12, 22, 0.85)' : 'rgba(10, 15, 26, 0.65)';
  ctx.beginPath();
  ctx.roundRect(x, y, badgeWidth, badgeHeight, 8);
  ctx.fill();

  ctx.strokeStyle = config.style === 'glow' ? '#6366f1' : 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw brand colored accent dot
  const dotRadius = 4;
  const dotX = x + paddingX + dotRadius;
  const dotY = y + badgeHeight / 2;

  ctx.fillStyle = '#6366f1'; // Indigo accent
  ctx.beginPath();
  ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
  ctx.fill();

  if (config.style === 'glow') {
    ctx.shadowColor = '#818cf8';
    ctx.shadowBlur = 6;
  }

  // Draw text
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, dotX + dotRadius + 8, dotY);

  ctx.restore();
}

/**
 * Loads an image from URL and burns the official KYRON.AI watermark into its pixels.
 */
export async function applyWatermarkToImage(
  imageUrl: string,
  config: WatermarkConfig = DEFAULT_WATERMARK_CONFIG
): Promise<string> {
  if (!config.enabled) return imageUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(imageUrl);

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Apply watermark
      drawWatermarkOnCanvas(ctx, canvas.width, canvas.height, config);

      try {
        const outUrl = canvas.toDataURL('image/png', 0.95);
        resolve(outUrl);
      } catch {
        resolve(imageUrl);
      }
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}
