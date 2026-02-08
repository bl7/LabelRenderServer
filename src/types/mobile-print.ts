// Types for mobile printing API

export type MobilePrintLabelType = "ingredients" | "menu"
export type MobilePrintLabelSubType = "prep" | "cooked" | "default" | "ppds" | "defrost"
export type MobilePrintLabelHeight = "40mm" | "80mm"

export interface MobilePrintAllergen {
  uuid?: number
  allergenName: string
  category?: string
  status?: "Active" | "Inactive"
  addedAt?: string
  isCustom?: boolean
}

export interface MobilePrintIngredient {
  uuid: string
  ingredientName: string
  allergens: Array<{ allergenName: string }>
}

export interface MobilePrintPrinter {
  dpi: 203 | 300
  labelSizeMm: {
    width: number
    height: number
  }
}

export interface MobilePrintRequest {
  // Core identification
  type: MobilePrintLabelType
  name: string
  labelType?: MobilePrintLabelSubType
  
  // Item data
  ingredients?: string[]
  allergens?: MobilePrintAllergen[]
  allIngredients?: MobilePrintIngredient[]
  allergensList?: string[] // Fallback allergen list
  
  // Dates
  printedOn?: string
  expiryDate?: string
  expiry?: string
  
  // Display options
  labelHeight?: MobilePrintLabelHeight
  useInitials?: boolean
  selectedInitial?: string
  maxIngredients?: number
  
  // PPDS specific
  storageInfo?: string
  businessName?: string
  
  // Print options
  copies?: number
  
  // Printer configuration
  printer: MobilePrintPrinter
  
  // Metadata
  uid?: string
  id?: string | number
  quantity?: number
}

export interface MobilePrintResponse {
  tsplBase64: string
  labelType: string
  dimensions: {
    width: number
    height: number
  }
}

export interface MobilePrintError {
  error: string
  message: string
  labelId?: string
}

