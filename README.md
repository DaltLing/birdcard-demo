# birdcard-demo

**Tryable Phase 1 web demo for birdcard** — mobile-first static site with mock AI identification.

## Live demo (open on phone — no GitHub account needed)

**Best share link (works without enabling Pages):**

- **https://raw.githack.com/DaltLing/birdcard-demo/main/index.html**

GitHub Pages (if/when enabled on the repo):

- https://daltling.github.io/birdcard-demo/

Other fallbacks:

- https://htmlpreview.github.io/?https://github.com/DaltLing/birdcard-demo/blob/main/index.html

## What it covers

1. Landing / start
2. Pick a US/Canada region
3. Upload or take a photo (`capture="environment"` on mobile)
4. Mock AI identify → top guess + confidence + candidate list
5. Confirm → add to collection as a card
6. View collection + card detail (habitat, appearance, range)

Tone: encouraging, playful, green/nature aesthetic. Labeled **Phase 1 demo (mock ID)**.

## Limits

- **Mock ID only** — not a real vision model; ~32 common US/Canada birds embedded, with light region bias.
- **localStorage** — collection stays in the browser on this device; clearing site data wipes cards. Large photos are stored as data URLs.
- Not the App Store build.

## Run locally

Open `index.html` (self-contained), or serve the folder:

```bash
python3 -m http.server 8080
```

Optional split sources: `styles.css`, `app.js` (also published for editing).

## Files

- `index.html` — full demo (CSS/JS inlined for easy hosting)
- `styles.css` / `app.js` — same assets as separate files
