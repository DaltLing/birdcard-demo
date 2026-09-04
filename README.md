# birdcard-demo

**Tryable Phase 1 web demo for birdcard** — mobile-first static site with real BirdWatcher AI identification (optional offline mock).

## Live demo (open on phone — no GitHub account needed)

**Primary share link:**

- **https://raw.githack.com/DaltLing/birdcard-demo/main/index.html**

Alternates:

- https://htmlpreview.github.io/?https://github.com/DaltLing/birdcard-demo/blob/main/index.html
- https://daltling.github.io/birdcard-demo/ (after enabling GitHub Pages: Settings → Pages → Deploy from branch `main` / root)

## What it covers

1. Landing / start (checkbox: **Use offline mock (no AI)** — default OFF)
2. Pick a US/Canada region
3. Upload or take a photo (`capture="environment"` on mobile)
4. Identify via BirdWatcher Edge Function → top guess + confidence + candidate list
5. Confirm → add to collection as a card
6. View collection + card detail (habitat, appearance, range)

Tone: encouraging, playful, green/nature aesthetic. Labeled **Phase 1 demo · AI ID**.

## Identify API

Calls `POST https://sqemrtitkgrpfotzwjbf.supabase.co/functions/v1/identify` with the BirdWatcher anon/publishable key (safe in the public demo).

**Required for live ID:** set Edge Function secrets on the BirdWatcher project:

- `GEMINI_API_KEY` (required)
- `OPENAI_API_KEY` (optional fallback)

Without vision keys, the function returns 503 / “No vision API keys configured” and the demo toasts a clear message (it will **not** invent a robin).

Toggle **Use offline mock (no AI)** on the landing screen to fall back to the old random region-biased mock.

## Limits

- **localStorage** — collection stays in the browser on this device; clearing site data wipes cards. Large photos are stored as data URLs.
- Not the App Store build.
- CORS / network required for live AI identify.
- Modern browser needed for `DecompressionStream` (used by compact `app.js` bootstrap on GitHub).

## Files

- `index.html` — modular UI shell (loads `styles.css`, `species.js`, `app.js`) — works on raw.githack
- `app.js` — compact gzip bootstrap that expands to the BirdWatcher identify client
- `app.source.js` — readable source for the identify client (edit this, then rebuild bootstrap / local inlined `index.html`)
- `styles.css` / `species.js` — modular CSS + species deck
