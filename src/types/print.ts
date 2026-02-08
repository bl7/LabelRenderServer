import type { Allergen } from "./allergen"

export type PrintQueueItem = {
  uid: string
  id: string | number
  type: "ingredients" | "menu"
  name: string
  quantity: number
  allergens?: Allergen[]
  ingredients?: string[]
  printedOn?: string
  expiryDate?: string
  labelType?: "cooked" | "prep" | "ppds" | "ppd" | "default"
}

