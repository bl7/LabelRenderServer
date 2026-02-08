export type Allergen = {
  uuid: number
  allergenName: string
  category: string
  status: "Active" | "Inactive"
  addedAt: string
  isCustom: boolean
}

