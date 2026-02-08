/**
 * Server-side rendering utility for label components
 * Uses Playwright to render React components to PNG with pixel-identical output
 */

import React from "react"
import { PrintQueueItem } from "../types/print"
import LabelRender from "../components/LabelRender"
import { PPDSLabelRenderer } from "../components/PPDSLabelRenderer"
import type { MobilePrintRequest } from "../types/mobile-print"

interface RenderOptions {
  widthPx: number
  heightPx: number
  dpi: number
}

/**
 * Renders a label component to PNG using Playwright
 * This ensures pixel-identical output to web labels
 */
export async function renderLabelToPng(
  request: MobilePrintRequest,
  options: RenderOptions
): Promise<Buffer> {
  // Dynamically import Playwright (only when needed)
  const { chromium } = await import("playwright")

  // Launch browser
  let browser
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
  } catch (error: any) {
    if (
      error?.message?.includes("Executable doesn't exist") ||
      error?.message?.includes("browserType.launch")
    ) {
      throw new Error(
        "Playwright browsers not installed. Please run: npx playwright install chromium"
      )
    }
    throw error
  }

  try {
    const page = await browser.newPage()

    // Set viewport to exact pixel dimensions
    await page.setViewportSize({
      width: options.widthPx,
      height: options.heightPx,
    })

    // Build the item object for the renderer
    const allergens = request.allergens
      ? request.allergens.map((a) => ({
          uuid: a.uuid || 0,
          allergenName: a.allergenName,
          category: a.category || "Other",
          status: (a.status || "Active") as "Active" | "Inactive",
          addedAt: a.addedAt || "",
          isCustom: a.isCustom || false,
        }))
      : undefined

    const labelType: "cooked" | "prep" | "ppds" | "ppd" | "default" | undefined =
      request.labelType === "defrost"
        ? "prep"
        : request.labelType === "ppds"
          ? "ppds"
          : request.labelType === "cooked"
            ? "cooked"
            : request.labelType === "prep"
              ? "prep"
              : request.labelType === "default"
                ? "default"
                : undefined

    const item: PrintQueueItem = {
      uid: request.uid || `mobile-${Date.now()}`,
      id: request.id || request.uid || `mobile-${Date.now()}`,
      type: request.type,
      name: request.name,
      quantity: request.quantity || request.copies || 1,
      ingredients: request.ingredients,
      allergens: allergens,
      printedOn: request.printedOn,
      expiryDate: request.expiryDate,
      labelType: labelType,
    }

    const expiry = request.expiry || request.expiryDate || ""
    const allergensList =
      request.allergensList ||
      (request.allergens ? request.allergens.map((a) => a.allergenName.toLowerCase()) : [])
    const allIngredients = request.allIngredients || []
    const isPPDS = request.labelType === "ppds" && request.type === "menu"
    const componentLabelHeight = request.labelHeight || (isPPDS ? "80mm" : "40mm")

    // Use React Server Components renderToString to get HTML
    const { renderToString } = await import("react-dom/server")

    let html: string

    if (isPPDS) {
      if (!request.storageInfo || !request.businessName) {
        throw new Error("PPDS labels require storageInfo and businessName")
      }
      html = renderToString(
        React.createElement(PPDSLabelRenderer, {
          item,
          storageInfo: request.storageInfo,
          businessName: request.businessName,
          allIngredients,
        })
      )
    } else {
      html = renderToString(
        React.createElement(LabelRender, {
          item,
          expiry,
          useInitials: request.useInitials || false,
          selectedInitial: request.selectedInitial || "",
          allergens: allergensList,
          maxIngredients: request.maxIngredients || 5,
          labelHeight: componentLabelHeight as "40mm" | "80mm",
          allIngredients,
        })
      )
    }

    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>* { box-sizing: border-box; } body { margin: 0; padding: 0; width: ${options.widthPx}px; height: ${options.heightPx}px; overflow: hidden; background: white; display: flex; align-items: flex-start; justify-content: flex-start; } #root { width: 100%; height: 100%; }</style></head><body><div id="root">${html}</div></body></html>`
    
    await page.setContent(fullHtml)
    await page.waitForTimeout(300)
    
    const screenshot = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: options.widthPx, height: options.heightPx },
    })

    return screenshot as Buffer
  } finally {
    await browser.close()
  }
}

