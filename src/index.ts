import express from "express"
import cors from "cors"
import type {
  MobilePrintRequest,
  MobilePrintResponse,
  MobilePrintError,
} from "./types/mobile-print"
import { renderLabelToPng } from "./lib/server-render"
import { convertPngToBitmap, calculateBitmapDimensions } from "./lib/bitmap-converter"
import { generateTSPLScript, combineTSPLWithBitmap } from "./lib/tspl-generator"

const app = express()
const PORT = process.env.PORT || 3002

// Middleware
app.use(cors())
app.use(express.json())

/**
 * POST /print-label
 * 
 * Generates TSPL (Thermal Printer Script Language) bytes for mobile printing
 * Returns Base64-encoded TSPL script with binary bitmap data
 */
app.post("/print-label", async (req, res) => {
  try {
    const request = req.body as MobilePrintRequest

    // Validate required fields
    if (!request.type || !request.name) {
      return res.status(400).json<MobilePrintError>({
        error: "VALIDATION_ERROR",
        message: "Missing required fields: type and name are required",
      })
    }

    if (!request.printer || !request.printer.dpi || !request.printer.labelSizeMm) {
      return res.status(400).json<MobilePrintError>({
        error: "VALIDATION_ERROR",
        message: "Missing required printer configuration: printer.dpi and printer.labelSizeMm are required",
      })
    }

    // Validate PPDS requirements
    if (request.labelType === "ppds" && request.type === "menu") {
      if (!request.storageInfo || !request.businessName) {
        return res.status(400).json<MobilePrintError>({
          error: "VALIDATION_ERROR",
          message: "PPDS labels require storageInfo and businessName",
        })
      }
    }

    // Validate menu items have ingredients
    if (request.type === "menu" && !request.ingredients) {
      return res.status(400).json<MobilePrintError>({
        error: "VALIDATION_ERROR",
        message: "Menu items require ingredients array",
      })
    }

    // Validate menu items have allIngredients for allergen mapping
    if (request.type === "menu" && !request.allIngredients) {
      return res.status(400).json<MobilePrintError>({
        error: "VALIDATION_ERROR",
        message: "Menu items require allIngredients array for allergen mapping",
      })
    }

    // Calculate pixel dimensions from printer DPI and label size
    const { dpi } = request.printer
    const { width: widthMm, height: heightMm } = request.printer.labelSizeMm

    const widthPx = Math.round((widthMm * dpi) / 25.4)
    const heightPx = Math.round((heightMm * dpi) / 25.4)

    // Determine label height (PPDS always uses 80mm, others use request or default 40mm)
    const isPPDS = request.labelType === "ppds" && request.type === "menu"
    const labelHeight = request.labelHeight || (isPPDS ? "80mm" : "40mm")

    // Render label to PNG using server-side rendering
    let pngBuffer: Buffer
    try {
      pngBuffer = await renderLabelToPng(request, {
        widthPx,
        heightPx,
        dpi,
      })
    } catch (error) {
      console.error("Label rendering error:", error)
      return res.status(500).json<MobilePrintError>({
        error: "RENDER_FAILED",
        message: error instanceof Error ? error.message : "Failed to render label",
        labelId: request.uid || request.id?.toString(),
      })
    }

    // Convert PNG to 1-bit monochrome bitmap
    let bitmapData: Buffer
    try {
      bitmapData = await convertPngToBitmap(pngBuffer, widthPx, heightPx, {
        threshold: 128,
      })
    } catch (error) {
      console.error("Bitmap conversion error:", error)
      return res.status(500).json<MobilePrintError>({
        error: "CONVERSION_FAILED",
        message: error instanceof Error ? error.message : "Failed to convert PNG to bitmap",
        labelId: request.uid || request.id?.toString(),
      })
    }

    // Calculate bitmap dimensions
    const { widthBytes, heightPx: bitmapHeight } = calculateBitmapDimensions(widthPx, heightPx)

    // Generate TSPL script
    const { commandString, bitmapData: tsplBitmapData } = generateTSPLScript(
      {
        widthMm,
        heightMm,
        gapMm: 0,
        direction: 0,
        referenceX: 0,
        referenceY: 0,
      },
      {
        widthBytes,
        heightPx: bitmapHeight,
        bitmapData,
        x: 0,
        y: 0,
      },
      request.copies || 1
    )

    // Combine TSPL command string with binary bitmap data
    const tsplBuffer = combineTSPLWithBitmap(commandString, tsplBitmapData)

    // Encode to Base64
    const tsplBase64 = tsplBuffer.toString("base64")

    // Return response
    const response: MobilePrintResponse = {
      tsplBase64,
      labelType: request.labelType || request.type,
      dimensions: {
        width: widthMm,
        height: heightMm,
      },
    }

    return res.status(200).json(response)
  } catch (error) {
    console.error("Mobile print API error:", error)
    return res.status(500).json<MobilePrintError>({
      error: "INTERNAL_ERROR",
      message: error instanceof Error ? error.message : "Internal server error",
    })
  }
})

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "label-render-server" })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Label Render Server running on http://localhost:${PORT}`)
  console.log(`📋 Print endpoint: http://localhost:${PORT}/print-label`)
  console.log(`❤️  Health check: http://localhost:${PORT}/health`)
})

