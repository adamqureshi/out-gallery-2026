# out-gallery (Shop / Inventory UI)

This is a **mobile-first, grayscale** “Shop / Inventory” UI for Only Used Tesla.

It’s designed for **least-friction buyer → seller contact**:
- browse listings
- tap a listing (VDP / profile view)
- swipe photos
- **Check availability / Chat / Text** (no login)

## What’s included

### List view (results)
- Listing cards show: **Year, Make, Model, Trim, Price, Miles, Location, VIN (last 6)**  
- Badges: **Dealer Ad vs Private Seller**, **Fleet Verified**, **History report**
- Save / favorites stored in `localStorage` (**no login required**)
- Filters drawer (mobile friendly): model, year range, max price, max miles, autopilot, seller type, fleet verified, history report, location text.

### VDP / Listing profile view
- Full-screen details screen (mobile-first)
- **Swipe gallery** with **10 placeholder images** (duplicates) + **thumbnail strip**
- **Images / Video** tabs (video is a placeholder for future uploads)
- Sticky bottom actions: **Check availability**, **Chat**, **Text**

### Contact modal (no login)
- Captures **email + mobile** (validation included)
- Prefills a message template (availability/chat/text)
- Currently logs the payload to the console (replace with your backend).

## Run locally
Open `index.html` in your browser.

## Hook up backend later
`app.js` currently logs the lead payload:
```js
console.log("LEAD (placeholder):", payload);
```
Replace with your POST request (Webhook, Supabase Edge Function, your API, etc.)

## Assets
- `assets/tesla-placeholder.png` (dark placeholder)
- `assets/tesla-model-Y.png` (white placeholder)

The gallery alternates these so you can see swipe + thumbnail behavior right away.
