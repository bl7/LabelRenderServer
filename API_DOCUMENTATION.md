# Label Render Server API Documentation

## Base URL
```
http://your-server-host:3002
```

## Endpoint
```
POST /print-label
```

## Headers
```
Content-Type: application/json
```

---

## Overview

This server renders labels server-side using React components and returns TSPL (Thermal Printer Script Language) data encoded in Base64. The mobile app can send this Base64 data directly to thermal printers.

**Workflow:**
1. Mobile app sends label data to `/print-label`
2. Server renders label using Playwright (headless browser)
3. Server converts rendered image to 1-bit monochrome bitmap
4. Server generates TSPL commands with bitmap data
5. Server returns Base64-encoded TSPL
6. Mobile app sends Base64 TSPL to thermal printer

---

## Request Format

### Required Fields

All requests **MUST** include:

```json
{
  "type": "ingredients" | "menu",
  "name": "Label Name",
  "printer": {
    "dpi": 203 | 300,
    "labelSizeMm": {
      "width": 60,
      "height": 40
    }
  }
}
```

### Field Descriptions

#### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `"ingredients"` \| `"menu"` | ✅ Yes | Label type: ingredients or menu item |
| `name` | `string` | ✅ Yes | Name of the item to display on label |
| `labelType` | `"prep"` \| `"cooked"` \| `"default"` \| `"ppds"` \| `"defrost"` | ❌ No | Label subtype (defaults based on context) |
| `printer` | `object` | ✅ Yes | Printer configuration (see below) |

#### Printer Configuration

```json
{
  "printer": {
    "dpi": 203,  // or 300 for higher quality
    "labelSizeMm": {
      "width": 60,   // Label width in millimeters
      "height": 40   // Label height in millimeters (40 or 80)
    }
  }
}
```

**DPI Options:**
- `203` - Standard thermal printer DPI (faster, smaller file)
- `300` - Higher quality DPI (slower, larger file)

**Common Label Sizes:**
- `60mm x 40mm` - Standard label
- `60mm x 80mm` - Tall label (required for PPDS)

#### Ingredients & Allergens

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ingredients` | `string[]` | ⚠️ Conditional | Array of ingredient names (required for menu type) |
| `allergens` | `Allergen[]` | ❌ No | Array of allergen objects (see below) |
| `allIngredients` | `Ingredient[]` | ⚠️ Conditional | Full ingredient objects with allergen mapping (required for menu type) |
| `allergensList` | `string[]` | ❌ No | Fallback array of allergen names (lowercase) |

**Allergen Object:**
```json
{
  "uuid": 1,
  "allergenName": "Milk",
  "category": "Dairy",
  "status": "Active",
  "addedAt": "2024-01-01",
  "isCustom": false
}
```

**Ingredient Object (for menu items):**
```json
{
  "uuid": "ingredient-123",
  "ingredientName": "Parmesan Cheese",
  "allergens": [
    {"allergenName": "Milk"}
  ]
}
```

#### Date Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `expiry` | `string` | ❌ No | Expiry date (format: "YYYY-MM-DD" or any string) |
| `expiryDate` | `string` | ❌ No | Alternative expiry date field |
| `printedOn` | `string` | ❌ No | Print date (format: "YYYY-MM-DD" or any string) |

#### Display Options

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `labelHeight` | `"40mm"` \| `"80mm"` | ❌ No | Label height override (default: 40mm, PPDS uses 80mm) |
| `useInitials` | `boolean` | ❌ No | Show initials on label (default: false) |
| `selectedInitial` | `string` | ❌ No | Initials to display (e.g., "JD") - required if useInitials is true |
| `maxIngredients` | `number` | ❌ No | Maximum ingredients to display (default: 5) |

#### PPDS-Specific Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `storageInfo` | `string` | ⚠️ Required for PPDS | Storage instructions (e.g., "Store at 4°C") |
| `businessName` | `string` | ⚠️ Required for PPDS | Business/restaurant name |

#### Print Options

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `copies` | `number` | ❌ No | Number of copies to print (default: 1) |

#### Metadata

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uid` | `string` | ❌ No | Unique identifier for the label |
| `id` | `string` \| `number` | ❌ No | Alternative ID field |
| `quantity` | `number` | ❌ No | Quantity of items |

---

## Response Format

### Success Response (200 OK)

```json
{
  "tsplBase64": "SVMgNjAgbW0sIDQwIG1tXG5HQVAgMCBtbVxuRElSRUNUSU9OIDBcblJFRkVSRU5DRSAwLCAwXG5DTFNcblBIT1RPIDAsIDAsIDAsIDQ3NiwgMzE1XG5QUklOVCAxLCAxXG4...",
  "labelType": "prep",
  "dimensions": {
    "width": 60,
    "height": 40
  }
}
```

**Response Fields:**
- `tsplBase64` (string) - Base64-encoded TSPL script with binary bitmap data
- `labelType` (string) - The label type that was rendered
- `dimensions` (object) - Label dimensions in millimeters

### Error Response (400/500)

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Missing required fields: type and name are required",
  "labelId": "optional-label-id"
}
```

**Error Types:**
- `VALIDATION_ERROR` - Invalid or missing required fields
- `RENDER_FAILED` - Failed to render label (server-side rendering error)
- `CONVERSION_FAILED` - Failed to convert PNG to bitmap
- `INTERNAL_ERROR` - Unexpected server error

---

## Request Examples

### 1. Basic Ingredients Label (Prep)

```json
{
  "type": "ingredients",
  "name": "Fresh Salad Mix",
  "labelType": "prep",
  "printer": {
    "dpi": 203,
    "labelSizeMm": {
      "width": 60,
      "height": 40
    }
  },
  "ingredients": ["Lettuce", "Tomato", "Cucumber", "Carrot"],
  "allergens": [],
  "allIngredients": [],
  "expiry": "2024-12-31",
  "labelHeight": "40mm"
}
```

### 2. Ingredients Label with Allergens

```json
{
  "type": "ingredients",
  "name": "Caesar Salad",
  "labelType": "prep",
  "printer": {
    "dpi": 203,
    "labelSizeMm": {
      "width": 60,
      "height": 40
    }
  },
  "ingredients": ["Lettuce", "Parmesan", "Croutons", "Caesar Dressing"],
  "allergens": [
    {
      "uuid": 1,
      "allergenName": "Milk",
      "category": "Dairy",
      "status": "Active"
    },
    {
      "uuid": 2,
      "allergenName": "Gluten",
      "category": "Grains",
      "status": "Active"
    }
  ],
  "allIngredients": [],
  "allergensList": ["milk", "gluten"],
  "expiry": "2024-12-31",
  "labelHeight": "40mm"
}
```

### 3. Ingredients Label with Initials

```json
{
  "type": "ingredients",
  "name": "Prepared by Chef",
  "labelType": "prep",
  "printer": {
    "dpi": 203,
    "labelSizeMm": {
      "width": 60,
      "height": 40
    }
  },
  "ingredients": ["Item 1", "Item 2"],
  "allergens": [],
  "allIngredients": [],
  "useInitials": true,
  "selectedInitial": "JD",
  "expiry": "2024-12-31",
  "labelHeight": "40mm"
}
```

### 4. Ingredients Label with Dates

```json
{
  "type": "ingredients",
  "name": "Label with Date",
  "labelType": "prep",
  "printer": {
    "dpi": 203,
    "labelSizeMm": {
      "width": 60,
      "height": 40
    }
  },
  "ingredients": ["Item 1", "Item 2"],
  "allergens": [],
  "allIngredients": [],
  "printedOn": "2024-02-08",
  "expiryDate": "2024-12-31",
  "labelHeight": "40mm"
}
```

### 5. Ingredients Label - Multiple Copies

```json
{
  "type": "ingredients",
  "name": "Batch Label",
  "labelType": "prep",
  "printer": {
    "dpi": 203,
    "labelSizeMm": {
      "width": 60,
      "height": 40
    }
  },
  "ingredients": ["Item 1", "Item 2"],
  "allergens": [],
  "allIngredients": [],
  "copies": 3,
  "expiry": "2024-12-31",
  "labelHeight": "40mm"
}
```

### 6. Ingredients Label - 80mm Height (More Space)

```json
{
  "type": "ingredients",
  "name": "Complex Recipe Mix",
  "labelType": "prep",
  "printer": {
    "dpi": 203,
    "labelSizeMm": {
      "width": 60,
      "height": 80
    }
  },
  "ingredients": [
    "Ingredient 1",
    "Ingredient 2",
    "Ingredient 3",
    "Ingredient 4",
    "Ingredient 5",
    "Ingredient 6",
    "Ingredient 7",
    "Ingredient 8"
  ],
  "allergens": [],
  "allIngredients": [],
  "expiry": "2024-12-31",
  "labelHeight": "80mm",
  "maxIngredients": 10
}
```

### 7. Menu Label (Prep)

```json
{
  "type": "menu",
  "name": "Chicken Caesar Salad",
  "labelType": "prep",
  "printer": {
    "dpi": 203,
    "labelSizeMm": {
      "width": 60,
      "height": 40
    }
  },
  "ingredients": ["Chicken", "Lettuce", "Parmesan", "Croutons"],
  "allergens": [
    {
      "uuid": 1,
      "allergenName": "Milk",
      "category": "Dairy",
      "status": "Active"
    }
  ],
  "allIngredients": [
    {
      "uuid": "1",
      "ingredientName": "Parmesan",
      "allergens": [{"allergenName": "Milk"}]
    },
    {
      "uuid": "2",
      "ingredientName": "Croutons",
      "allergens": [{"allergenName": "Gluten"}]
    }
  ],
  "allergensList": ["milk", "gluten"],
  "expiry": "2024-12-31",
  "labelHeight": "40mm"
}
```

**⚠️ Important for Menu Labels:**
- `ingredients` array is **REQUIRED**
- `allIngredients` array is **REQUIRED** (for allergen mapping)
- `allIngredients` should contain full ingredient objects with allergen information

### 8. Menu Label (Cooked)

```json
{
  "type": "menu",
  "name": "Grilled Salmon",
  "labelType": "cooked",
  "printer": {
    "dpi": 203,
    "labelSizeMm": {
      "width": 60,
      "height": 40
    }
  },
  "ingredients": ["Salmon", "Lemon", "Dill", "Butter"],
  "allergens": [
    {
      "uuid": 1,
      "allergenName": "Fish",
      "category": "Seafood",
      "status": "Active"
    },
    {
      "uuid": 2,
      "allergenName": "Milk",
      "category": "Dairy",
      "status": "Active"
    }
  ],
  "allIngredients": [
    {
      "uuid": "1",
      "ingredientName": "Salmon",
      "allergens": [{"allergenName": "Fish"}]
    },
    {
      "uuid": "2",
      "ingredientName": "Butter",
      "allergens": [{"allergenName": "Milk"}]
    }
  ],
  "allergensList": ["fish", "milk"],
  "expiry": "2024-12-31",
  "labelHeight": "40mm"
}
```

### 9. Menu Label (Default)

```json
{
  "type": "menu",
  "name": "Beef Burger",
  "labelType": "default",
  "printer": {
    "dpi": 300,
    "labelSizeMm": {
      "width": 60,
      "height": 40
    }
  },
  "ingredients": ["Beef Patty", "Bun", "Lettuce", "Tomato", "Onion"],
  "allergens": [
    {
      "uuid": 1,
      "allergenName": "Gluten",
      "category": "Grains",
      "status": "Active"
    }
  ],
  "allIngredients": [
    {
      "uuid": "1",
      "ingredientName": "Bun",
      "allergens": [{"allergenName": "Gluten"}]
    }
  ],
  "allergensList": ["gluten"],
  "expiry": "2024-12-31",
  "labelHeight": "40mm"
}
```

### 10. Menu Label (Defrost)

```json
{
  "type": "menu",
  "name": "Frozen Pasta",
  "labelType": "defrost",
  "printer": {
    "dpi": 203,
    "labelSizeMm": {
      "width": 60,
      "height": 40
    }
  },
  "ingredients": ["Pasta", "Tomato Sauce", "Cheese"],
  "allergens": [
    {
      "uuid": 1,
      "allergenName": "Gluten",
      "category": "Grains",
      "status": "Active"
    },
    {
      "uuid": 2,
      "allergenName": "Milk",
      "category": "Dairy",
      "status": "Active"
    }
  ],
  "allIngredients": [
    {
      "uuid": "1",
      "ingredientName": "Pasta",
      "allergens": [{"allergenName": "Gluten"}]
    },
    {
      "uuid": "2",
      "ingredientName": "Cheese",
      "allergens": [{"allergenName": "Milk"}]
    }
  ],
  "allergensList": ["gluten", "milk"],
  "expiry": "2024-12-31",
  "labelHeight": "40mm"
}
```

### 11. PPDS Label (80mm Height Required)

```json
{
  "type": "menu",
  "name": "Chicken Curry",
  "labelType": "ppds",
  "printer": {
    "dpi": 203,
    "labelSizeMm": {
      "width": 60,
      "height": 80
    }
  },
  "ingredients": ["Chicken", "Onion", "Garlic", "Curry Powder", "Coconut Milk"],
  "allergens": [],
  "allIngredients": [
    {
      "uuid": "1",
      "ingredientName": "Chicken",
      "allergens": []
    },
    {
      "uuid": "2",
      "ingredientName": "Coconut Milk",
      "allergens": []
    }
  ],
  "storageInfo": "Store at 4°C. Use within 3 days of opening.",
  "businessName": "Test Restaurant Ltd",
  "expiry": "2024-12-31",
  "labelHeight": "80mm"
}
```

**⚠️ Important for PPDS Labels:**
- `labelType` must be `"ppds"`
- `type` must be `"menu"`
- `storageInfo` is **REQUIRED**
- `businessName` is **REQUIRED**
- `labelHeight` should be `"80mm"` (or labelSizeMm.height should be 80)
- `printer.labelSizeMm.height` should be 80mm

### 12. PPDS Label with Allergens

```json
{
  "type": "menu",
  "name": "Seafood Pasta",
  "labelType": "ppds",
  "printer": {
    "dpi": 203,
    "labelSizeMm": {
      "width": 60,
      "height": 80
    }
  },
  "ingredients": ["Pasta", "Prawns", "Garlic", "White Wine", "Cream"],
  "allergens": [
    {
      "uuid": 1,
      "allergenName": "Gluten",
      "category": "Grains",
      "status": "Active"
    },
    {
      "uuid": 2,
      "allergenName": "Crustaceans",
      "category": "Seafood",
      "status": "Active"
    },
    {
      "uuid": 3,
      "allergenName": "Milk",
      "category": "Dairy",
      "status": "Active"
    }
  ],
  "allIngredients": [
    {
      "uuid": "1",
      "ingredientName": "Pasta",
      "allergens": [{"allergenName": "Gluten"}]
    },
    {
      "uuid": "2",
      "ingredientName": "Prawns",
      "allergens": [{"allergenName": "Crustaceans"}]
    },
    {
      "uuid": "3",
      "ingredientName": "Cream",
      "allergens": [{"allergenName": "Milk"}]
    }
  ],
  "allergensList": ["gluten", "crustaceans", "milk"],
  "storageInfo": "Store at 4°C. Keep refrigerated. Consume within 2 days.",
  "businessName": "Fine Dining Restaurant",
  "expiry": "2024-12-31",
  "labelHeight": "80mm"
}
```

### 13. High-Resolution Label (300 DPI)

```json
{
  "type": "ingredients",
  "name": "High Quality Label",
  "labelType": "prep",
  "printer": {
    "dpi": 300,
    "labelSizeMm": {
      "width": 60,
      "height": 40
    }
  },
  "ingredients": ["Item 1", "Item 2"],
  "allergens": [],
  "allIngredients": [],
  "expiry": "2024-12-31",
  "labelHeight": "40mm"
}
```

**Note:** 300 DPI produces larger TSPL files but higher quality output.

---

## Validation Rules

### Required Fields by Request Type

#### All Requests
- ✅ `type` (must be "ingredients" or "menu")
- ✅ `name`
- ✅ `printer.dpi`
- ✅ `printer.labelSizeMm.width`
- ✅ `printer.labelSizeMm.height`

#### Menu Type Requests
- ✅ `ingredients` array (must not be empty)
- ✅ `allIngredients` array (required for allergen mapping)

#### PPDS Labels (labelType: "ppds" + type: "menu")
- ✅ `storageInfo`
- ✅ `businessName`

### Common Validation Errors

```json
// Missing printer config
{
  "error": "VALIDATION_ERROR",
  "message": "Missing required printer configuration: printer.dpi and printer.labelSizeMm are required"
}

// Missing menu ingredients
{
  "error": "VALIDATION_ERROR",
  "message": "Menu items require ingredients array"
}

// Missing allIngredients for menu
{
  "error": "VALIDATION_ERROR",
  "message": "Menu items require allIngredients array for allergen mapping"
}

// Missing PPDS fields
{
  "error": "VALIDATION_ERROR",
  "message": "PPDS labels require storageInfo and businessName"
}
```

---

## Mobile App Integration Guide

### Step 1: Make HTTP Request

```javascript
// Example in JavaScript/TypeScript
const response = await fetch('http://your-server:3002/print-label', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'ingredients',
    name: 'Fresh Salad',
    labelType: 'prep',
    printer: {
      dpi: 203,
      labelSizeMm: {
        width: 60,
        height: 40
      }
    },
    ingredients: ['Lettuce', 'Tomato'],
    allergens: [],
    allIngredients: [],
    expiry: '2024-12-31'
  })
});

const data = await response.json();
```

### Step 2: Handle Response

```javascript
if (response.ok) {
  const { tsplBase64, labelType, dimensions } = data;
  
  // tsplBase64 is ready to send to printer
  await sendToPrinter(tsplBase64);
} else {
  const { error, message } = data;
  console.error('Error:', error, message);
}
```

### Step 3: Send to Thermal Printer

The `tsplBase64` string contains the complete TSPL script with binary bitmap data. You need to:

1. **Decode Base64** to get the raw TSPL bytes
2. **Send bytes to printer** via Bluetooth/USB/WiFi

```javascript
// Example: Decode and send
const tsplBytes = atob(tsplBase64); // or Buffer.from(tsplBase64, 'base64') in Node.js

// Send to printer (implementation depends on your printer SDK)
await printerConnection.write(tsplBytes);
```

### Error Handling

Always check the response status and handle errors:

```javascript
try {
  const response = await fetch('http://your-server:3002/print-label', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const data = await response.json();
  return data.tsplBase64;
} catch (error) {
  console.error('Label generation failed:', error);
  // Show error to user
  throw error;
}
```

---

## Label Type Reference

### Label Types (`labelType`)

| Value | Description | Use Case |
|-------|-------------|----------|
| `"prep"` | Prep label | Items being prepared |
| `"cooked"` | Cooked label | Cooked/prepared items |
| `"default"` | Default label | Standard items |
| `"ppds"` | PPDS label | Pre-packed for direct sale (requires storageInfo & businessName) |
| `"defrost"` | Defrost label | Items being defrosted |

### Request Types (`type`)

| Value | Description | Requirements |
|-------|-------------|--------------|
| `"ingredients"` | Ingredients label | Basic ingredient list |
| `"menu"` | Menu item label | Requires `ingredients` and `allIngredients` arrays |

---

## Best Practices

1. **Always validate required fields** before sending request
2. **Handle network errors** - implement retry logic for failed requests
3. **Cache TSPL data** - if printing same label multiple times, cache the Base64 response
4. **Use appropriate DPI** - 203 DPI is faster and sufficient for most cases
5. **Set label height correctly** - 40mm for standard, 80mm for PPDS or long ingredient lists
6. **Include allIngredients for menu items** - required for proper allergen mapping
7. **Provide storageInfo and businessName for PPDS** - these are mandatory
8. **Use copies field** - more efficient than making multiple requests for same label

---

## Health Check

Check if server is running:

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "label-render-server"
}
```

---

## Support

For issues or questions, check server logs or contact the development team.

