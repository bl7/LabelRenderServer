import React from "react"
import { PrintQueueItem } from "../types/print"

export type LabelHeight = "40mm" | "80mm"

interface LabelRenderProps {
  item: PrintQueueItem
  expiry: string
  useInitials: boolean
  selectedInitial: string
  allergens: string[]
  maxIngredients?: number
  labelHeight?: LabelHeight
  allIngredients: Array<{
    uuid: string
    ingredientName: string
    allergens: { allergenName: string }[]
  }>
}

function fitText(text: string, maxLen: number) {
  return text.length > maxLen ? text.slice(0, maxLen - 3) + "..." : text
}

export default function LabelRender({
  item,
  expiry,
  useInitials,
  selectedInitial,
  allergens,
  maxIngredients = 5,
  labelHeight = "40mm",
  allIngredients = [],
}: LabelRenderProps) {
  // --- Sizing and layout configuration ---
  const labelConfig = {
    "40mm": {
      heightCm: 4.0,
      fontSize: 15,
      nameFontSize: 21,
      sectionSpacing: 4,
      padding: 0,
      maxNameLen: 22,
      maxIngLen: 16,
      maxAllergenLen: 12,
      maxIngredientsToShow: 5,
      expiresFontSize: 12,
      metaFontSize: 9.5,
      containsFontSize: 10.5,
      ppdsFontSize: 9.5,
    },
    "80mm": {
      heightCm: 8.0,
      fontSize: 17,
      nameFontSize: 25,
      sectionSpacing: 8,
      padding: 0,
      maxNameLen: 32,
      maxIngLen: 22,
      maxAllergenLen: 18,
      maxIngredientsToShow: 12,
      expiresFontSize: 16,
      metaFontSize: 13,
      containsFontSize: 15,
      ppdsFontSize: 14,
    },
  }

  const config = labelConfig[labelHeight]
  const { heightCm, fontSize, nameFontSize, sectionSpacing, padding } = config

  const LABEL_WIDTH_CM = 6.0
  const labelWidthCm = LABEL_WIDTH_CM
  const labelHeightCm = heightCm

  const baseStyle = {
    width: `${labelWidthCm}cm`,
    height: `${labelHeightCm}cm`,
    padding: 0,
    backgroundColor: "white",
    fontFamily: "Menlo, Consolas, 'Liberation Mono', monospace",
    fontWeight: 500,
    fontSize,
    display: "flex",
    flexDirection: "column" as const,
    boxSizing: "border-box" as const,
    border: "2px solid black",
    borderRadius: 6,
    position: "relative" as const,
    overflow: "visible" as const,
    margin: 0,
    letterSpacing: 0,
  }

  const shortDate = (date: string) => {
    try {
      const d = new Date(date)
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    } catch {
      return date || "N/A"
    }
  }

  const getDayShort = (date: string) => {
    try {
      const d = new Date(date)
      return d.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase()
    } catch {
      return ""
    }
  }

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()

  const getNameFontSize = (name: string, baseFontSize: number, labelHeight: string) => {
    if (!name) return baseFontSize
    const wordCount = name.trim().split(/\s+/).length
    if (labelHeight === "40mm") {
      if (wordCount === 2) return Math.max(baseFontSize - 2, 12)
      if (wordCount >= 3) return Math.max(baseFontSize - 4, 11)
    } else if (labelHeight === "80mm") {
      if (wordCount === 2) return Math.max(baseFontSize - 4, 12)
      if (wordCount >= 3) return Math.max(baseFontSize - 6, 11)
    }
    return baseFontSize
  }

  const shortPrinted = shortDate(item.printedOn || "")
  const shortExpiry = shortDate(expiry || item.expiryDate || "")
  const expiresDay = getDayShort(expiry || item.expiryDate || "")
  const labelTypeShort = item.labelType ? item.labelType.toUpperCase() : ""

  const globalAllergenNames = allergens.map((a) => a.toLowerCase())

  let itemAllergenNames: string[] = []
  if (item.type === "ingredients" && Array.isArray(item.allergens)) {
    itemAllergenNames = item.allergens
      .map(
        (a: any) =>
          a.allergenName?.toLowerCase() || a.name?.toLowerCase() || a.toLowerCase?.() || ""
      )
      .filter(Boolean)
  } else {
    itemAllergenNames = globalAllergenNames
  }

  const getIngredientObj = (ing: string) => {
    return allIngredients.find(
      (i) => i.ingredientName.trim().toLowerCase() === ing.trim().toLowerCase() || i.uuid === ing
    )
  }

  const allergenMap: Record<string, string[]> = {}
  let allergenicIngredients: string[] = []

  if (item.type === "menu" && Array.isArray(item.ingredients)) {
    item.ingredients.forEach((ing) => {
      const obj = getIngredientObj(ing)
      if (obj && obj.allergens && obj.allergens.length > 0) {
        allergenMap[ing] = obj.allergens.map((a) => a.allergenName.toUpperCase())
        allergenicIngredients.push(ing)
      } else {
        allergenMap[ing] = []
      }
    })
  }

  const headerStyle = {
    textAlign: "center" as const,
    backgroundColor: "black",
    color: "white",
    padding: "2px 0",
    marginBottom: sectionSpacing - 1,
    position: "relative" as const,
    fontSize: getNameFontSize(item.name, nameFontSize, labelHeight),
    fontWeight: 900,
    borderRadius: 2,
    fontFamily: "inherit",
    letterSpacing: 0,
  }

  const isUseFirst = item.name === "USE FIRST"
  if (isUseFirst) {
    const circleSize = "2.8cm"
    const circleFont = 18
    return (
      <div
        style={{
          ...baseStyle,
          backgroundColor: "black",
          fontWeight: "bold",
          justifyContent: "center",
          alignItems: "center",
          padding: 0,
        }}
      >
        <div
          style={{
            width: circleSize,
            height: circleSize,
            borderRadius: "50%",
            backgroundColor: "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            border: "3px solid white",
            boxShadow: "0 0 0 2px black",
          }}
        >
          <div
            style={{
              textAlign: "center",
              color: "black",
              fontSize: circleFont,
              fontWeight: 900,
              letterSpacing: 1,
              textTransform: "uppercase",
              lineHeight: 1.2,
              padding: "4px",
            }}
          >
            USE
            <br />
            FIRST
          </div>
        </div>
      </div>
    )
  }

  if (
    (item.labelType === "cooked" || item.labelType === "prep" || item.labelType === "default") &&
    item.type === "menu"
  ) {
    const uniqueAllergens = Array.from(
      new Set(allergenicIngredients.flatMap((ing) => allergenMap[ing] || []))
    )
    return (
      <div style={baseStyle}>
        <div style={headerStyle}>{item.name}</div>
        <div
          style={{
            fontWeight: 900,
            fontSize: config.expiresFontSize,
            marginBottom: 2,
            fontFamily: "inherit",
            letterSpacing: 0,
            width: "100%",
          }}
        >
          <span>Expires: {expiresDay} {shortExpiry}</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: config.metaFontSize,
            fontWeight: 600,
            marginBottom: 2,
            fontFamily: "inherit",
            letterSpacing: 0,
          }}
        >
          <span>Printed: {shortPrinted}</span>
          {useInitials && selectedInitial && (
            <span style={{ fontWeight: 900, margin: "0 8px" }}>{selectedInitial}</span>
          )}
          {item.labelType !== "default" && (
            <span style={{ fontWeight: 700 }}>{labelTypeShort}</span>
          )}
        </div>
        <div
          style={{
            fontWeight: 700,
            fontSize: config.containsFontSize,
            textAlign: "left",
            marginTop: 0,
            letterSpacing: 0,
            fontFamily: "inherit",
            display: "block",
            lineHeight: 1.2,
          }}
        >
          <span style={{ fontWeight: 700, fontFamily: "inherit" }}>Contains: </span>
          {uniqueAllergens.length === 0 ? (
            <span style={{ fontWeight: 500, fontFamily: "inherit" }}>
              Does not contain any allergens
            </span>
          ) : (
            <span style={{ fontWeight: 600, fontFamily: "inherit" }}>
              {uniqueAllergens.join(", ")}
            </span>
          )}
        </div>
      </div>
    )
  }

  if (item.labelType === "ppds" && item.type === "menu") {
    const safeIngredients = Array.isArray(item.ingredients) ? item.ingredients : []
    const ingredientsLine = safeIngredients.map((ing, idx) => (
      <span
        key={ing + idx}
        style={{
          fontWeight: allergenMap[ing] && allergenMap[ing].length > 0 ? 600 : 500,
          fontFamily: "inherit",
        }}
      >
        {capitalize(ing)}
        {allergenMap[ing] && allergenMap[ing].length > 0 && (
          <>
            {" "}
            (
            <span style={{ fontWeight: 900, fontFamily: "inherit" }}>
              {allergenMap[ing].map((a, i) => (
                <span key={a + i} style={{ fontWeight: 900, fontFamily: "inherit" }}>
                  *{a}*{i < allergenMap[ing].length - 1 ? ", " : ""}
                </span>
              ))}
            </span>
            )
          </>
        )}
        {idx < safeIngredients.length - 1 && ", "}
      </span>
    ))
    return (
      <div style={baseStyle}>
        <div style={headerStyle}>{item.name}</div>
        <div
          style={{
            fontSize: fontSize - 1,
            marginBottom: sectionSpacing - 2,
            fontWeight: 700,
            textAlign: "center",
            fontFamily: "inherit",
            letterSpacing: 0,
          }}
        >
          Best Before: {shortExpiry}
        </div>
        <div
          style={{
            fontWeight: 700,
            fontSize: config.ppdsFontSize,
            marginBottom: sectionSpacing - 1,
            textAlign: "left",
            display: "block",
            wordBreak: "break-word",
            fontFamily: "inherit",
            letterSpacing: 0,
            lineHeight: 1.2,
          }}
        >
          <span style={{ fontWeight: 700, marginRight: 2, fontFamily: "inherit" }}>
            Ingredients:{" "}
          </span>
          {ingredientsLine}
        </div>
      </div>
    )
  }

  if (
    item.type === "ingredients" &&
    (!item.labelType ||
      item.labelType === "cooked" ||
      item.labelType === "prep" ||
      item.labelType === "default")
  ) {
    return (
      <div style={baseStyle}>
        <div style={headerStyle}>{item.name}</div>
        <div
          style={{
            fontWeight: 900,
            fontSize: config.expiresFontSize,
            marginBottom: 2,
            fontFamily: "inherit",
            letterSpacing: 0,
            width: "100%",
          }}
        >
          <span>Expires: {expiresDay} {shortExpiry}</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: config.metaFontSize,
            fontWeight: 600,
            marginBottom: 2,
            fontFamily: "inherit",
            letterSpacing: 0,
          }}
        >
          <span>Printed: {shortPrinted}</span>
          {useInitials && selectedInitial && (
            <span style={{ fontWeight: 900, marginLeft: 12 }}>{selectedInitial}</span>
          )}
        </div>
        {itemAllergenNames.length > 0 ? (
          <>
            <div
              style={{
                fontWeight: 900,
                color: "black",
                fontSize: fontSize,
                textAlign: "center",
                marginTop: 2,
                letterSpacing: 1,
                textTransform: "uppercase",
                fontFamily: "inherit",
              }}
            >
              CONTAINS ALLERGENS
            </div>
            <div
              style={{
                fontWeight: 700,
                color: "black",
                fontSize: fontSize - 2,
                textAlign: "center",
                marginTop: 1,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                fontFamily: "inherit",
              }}
            >
              {itemAllergenNames.join(", ")}
            </div>
          </>
        ) : (
          <div
            style={{
              fontWeight: 900,
              color: "black",
              fontSize: fontSize,
              textAlign: "center",
              marginTop: 2,
              letterSpacing: 1,
              textTransform: "uppercase",
              fontFamily: "inherit",
            }}
          >
            DOES NOT CONTAIN ANY ALLERGEN
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={baseStyle}>
      <div style={{ ...headerStyle, fontSize: nameFontSize, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", fontFamily: "monospace" }}>
        {item.name}
      </div>
    </div>
  )
}

