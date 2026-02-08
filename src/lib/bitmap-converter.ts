/**
 * Converts PNG image data to 1-bit monochrome bitmap for TSPL printing
 */

export interface BitmapConversionOptions {
  threshold?: number // 0-255, default 128
}

/**
 * Converts PNG buffer to 1-bit monochrome bitmap
 * @param pngBuffer PNG image buffer
 * @param widthPx Image width in pixels
 * @param heightPx Image height in pixels
 * @param options Conversion options
 * @returns Packed bitmap data (1 bit per pixel, 8 pixels per byte)
 */
export async function convertPngToBitmap(
  pngBuffer: Buffer,
  widthPx: number,
  heightPx: number,
  options: BitmapConversionOptions = {}
): Promise<Buffer> {
  const threshold = options.threshold ?? 128

  // Use sharp to convert PNG to grayscale, resize to exact dimensions, and get raw pixel data
  const sharp = await import("sharp")
  const image = sharp.default(pngBuffer)

  // Resize to exact dimensions and convert to grayscale, then get raw pixel data
  const { data, info } = await image
    .resize(widthPx, heightPx, {
      fit: "fill", // Fill exact dimensions
      kernel: "lanczos3", // High-quality resampling
    })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Verify dimensions after resize
  if (info.width !== widthPx || info.height !== heightPx) {
    throw new Error(
      `Failed to resize image: expected ${widthPx}x${heightPx}, got ${info.width}x${info.height}`
    )
  }

  // Calculate bytes per row (rounded up to nearest byte)
  const widthBytes = Math.ceil(widthPx / 8)
  const totalBytes = widthBytes * heightPx

  // Create output buffer
  const bitmapBuffer = Buffer.alloc(totalBytes, 0)

  // Convert each pixel to 1-bit (black/white)
  for (let y = 0; y < heightPx; y++) {
    for (let x = 0; x < widthPx; x++) {
      const pixelIndex = y * widthPx + x
      const grayValue = data[pixelIndex]

      // Threshold: values below threshold become black (1), above become white (0)
      const isBlack = grayValue < threshold

      if (isBlack) {
        const byteIndex = y * widthBytes + Math.floor(x / 8)
        const bitIndex = 7 - (x % 8) // MSB first
        bitmapBuffer[byteIndex] |= 1 << bitIndex
      }
    }
  }

  return bitmapBuffer
}

/**
 * Calculate bitmap dimensions in bytes
 */
export function calculateBitmapDimensions(widthPx: number, heightPx: number) {
  const widthBytes = Math.ceil(widthPx / 8)
  return {
    widthBytes,
    heightPx,
    totalBytes: widthBytes * heightPx,
  }
}

