/**
 * TSPL (Thermal Printer Script Language) generator
 * Generates TSPL commands for bitmap printing
 */

export interface TSPLConfig {
  widthMm: number // Label width in mm
  heightMm: number // Label height in mm
  gapMm?: number // Gap between labels in mm (default: 0)
  direction?: 0 | 1 // Print direction: 0 = normal, 1 = 180° rotated (default: 0)
  referenceX?: number // Reference X position in dots (default: 0)
  referenceY?: number // Reference Y position in dots (default: 0)
}

export interface TSPLBitmapData {
  widthBytes: number // Width in bytes (8 pixels per byte)
  heightPx: number // Height in pixels
  bitmapData: Buffer // Packed 1-bit bitmap data
  x?: number // X position in dots (default: 0)
  y?: number // Y position in dots (default: 0)
}

/**
 * Generates TSPL command string for label setup
 */
export function generateTSPLSetup(config: TSPLConfig): string {
  const { widthMm, heightMm, gapMm = 0, direction = 0, referenceX = 0, referenceY = 0 } = config

  // Convert mm to dots (assuming 203 DPI: 1mm = 8 dots, 300 DPI: 1mm = 11.81 dots)
  // We'll use the actual DPI from the printer, but for SIZE command we use mm
  const commands: string[] = []

  // SIZE: width in mm, height in mm
  commands.push(`SIZE ${widthMm.toFixed(2)} mm, ${heightMm.toFixed(2)} mm`)

  // GAP: gap in mm (gap between labels)
  if (gapMm > 0) {
    commands.push(`GAP ${gapMm.toFixed(2)} mm`)
  } else {
    commands.push("GAP 0 mm") // No gap
  }

  // DIRECTION: 0 = normal, 1 = 180° rotated
  commands.push(`DIRECTION ${direction}`)

  // REFERENCE: reference point (x, y) in dots
  commands.push(`REFERENCE ${referenceX}, ${referenceY}`)

  // CLS: clear image buffer
  commands.push("CLS")

  return commands.join("\n") + "\n"
}

/**
 * Generates TSPL BITMAP command with binary data
 * Note: The bitmap data must be appended as binary, not as part of the command string
 *
 * TSPL syntax (for TSC printers):
 *   BITMAP x, y, width_bytes, height, mode, bitmap_data
 *
 * - width_bytes: number of BYTES per row (8 pixels per byte)
 * - height: number of rows (pixels)
 * - mode: 0 = overwrite, 1 = OR, 2 = XOR, 3 = inverse, etc. (we use 0)
 */
export function generateTSPLBitmapCommand(bitmap: TSPLBitmapData): string {
  const { widthBytes, heightPx, x = 0, y = 0 } = bitmap

  // BITMAP command: x, y, width_bytes, height, mode, bitmap_data
  // Width is in bytes (8 pixels per byte), height is in pixels
  // Mode 0 = overwrite
  return `BITMAP ${x}, ${y}, ${widthBytes}, ${heightPx}, 0\n`
}

/**
 * Generates TSPL PRINT command
 */
export function generateTSPLPrintCommand(copies: number = 1): string {
  return `PRINT ${copies}, 1\n`
}

/**
 * Generates complete TSPL script for a label
 * Returns the TSPL command string and the binary bitmap data separately
 */
export function generateTSPLScript(
  config: TSPLConfig,
  bitmap: TSPLBitmapData,
  copies: number = 1
): { commandString: string; bitmapData: Buffer } {
  const setup = generateTSPLSetup(config)
  const bitmapCommand = generateTSPLBitmapCommand(bitmap)
  const printCommand = generateTSPLPrintCommand(copies)

  const commandString = setup + bitmapCommand + printCommand

  return {
    commandString,
    bitmapData: bitmap.bitmapData,
  }
}

/**
 * Combines TSPL command string with binary bitmap data
 * Returns complete TSPL script as Buffer (for Base64 encoding)
 */
export function combineTSPLWithBitmap(
  commandString: string,
  bitmapData: Buffer
): Buffer {
  // Convert command string to buffer
  const commandBuffer = Buffer.from(commandString, "utf-8")

  // Combine command buffer + bitmap data
  return Buffer.concat([commandBuffer, bitmapData])
}

