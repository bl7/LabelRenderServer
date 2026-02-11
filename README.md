# Label Render Server

Standalone Node.js server for rendering labels to TSPL (Thermal Printer Script Language) format for mobile printing.

## Features

- Pixel-identical rendering to web dashboard labels
- Supports all label types: Prep, Cook, Ingredient, PPDS, Defrost, Use First
- Uses Playwright for server-side rendering
- Converts rendered PNG to 1-bit monochrome bitmap
- Generates TSPL commands with binary bitmap data
- Returns Base64-encoded TSPL for mobile apps

## Installation

```bash
cd server
npm install
npx playwright install chromium
```

## Development

```bash
npm run dev
```

Server runs on `http://localhost:5002`

## Production

```bash
npm run build
npm start
```

## API Endpoint

### POST /print-label

Generates TSPL bytes for a label.

**Request Body:**
See `MOBILE_APP_INTEGRATION.md` in the webdashboard folder for full request/response format.

**Response:**
```json
{
  "tsplBase64": "base64-encoded-tspl-bytes",
  "labelType": "prep",
  "dimensions": {
    "width": 60,
    "height": 40
  }
}
```

## Health Check

### GET /health

Returns server status.

## Notes

- This server is separate from the Next.js webdashboard
- Uses regular Playwright (not serverless version) for better compatibility
- Ensure Playwright browsers are installed: `npx playwright install chromium`

