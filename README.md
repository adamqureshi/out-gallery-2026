# out-gallery (Shop / Inventory UI)

This is a **mobile-first, grayscale** inventory/listing page for Only Used Tesla.

## What’s included
- List view cards: **Year, Make, Model, Trim, Price, Miles, Location, VIN**, seller type (**Dealer vs Private**) and **Autopilot** info.
- Filters drawer (mobile friendly): model, year range, max price, max miles, autopilot, seller type, fleet verified, history report, location text.
- Save / favorites (stored in localStorage — no login required).
- Detail view: **bottom sheet** with a simple gallery (1 image placeholder) + CTA buttons.
- “Check availability” modal: captures **email + mobile** with validation, no account required.
- Yo‑Yo agent UI bubble (placeholder).

## Run locally
Open `index.html` in your browser.

## Hook up backend later
`app.js` currently logs the lead payload to the console:
```js
console.log("LEAD (placeholder):", payload);
```
Replace that with your POST request (Webhook, Supabase Edge Function, your API, etc.)

## Assets
`assets/tesla-placeholder.png` is a placeholder image bundled for the gallery.
