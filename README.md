# birdcard-demo

**Tryable Phase 1 web demo for birdcard** — mobile-first static site with mock AI identification.

## Live demo (open on phone — no GitHub account needed)

**Primary share link (recommended — single-file inlined app):**

- **https://raw.githack.com/DaltLing/birdcard-demo/main/index.html**

Alternates:

- https://htmlpreview.github.io/?https://github.com/DaltLing/birdcard-demo/blob/main/index.html *(often fails to run JS)*
- https://daltling.github.io/birdcard-demo/ (enable in Settings → Pages → Deploy from branch `main` / `/`)

GitHub Pages could not be enabled via API (`gh` unauthenticated / empty `GH_TOKEN`). Repo is public — one-click Pages enable gives the cleanest URL.

## What it covers

1. Landing / start
2. Pick a US/Canada region
3. Upload or take a photo (`capture="environment"` on mobile)
4. Mock AI identify → top guess + confidence + candidate list
5. Confirm → add to collection as a card
6. View collection + card detail (habitat, appearance, range)

Tone: encouraging, playful, green/nature aesthetic. Labeled **Phase 1 demo (mock ID)**.

## Limits

- **Mock ID only** — not a real vision model; 24 common US/Canada birds embedded, with light region bias.
- **localStorage** — collection stays in the browser on this device; clearing site data wipes cards. Large photos are stored as data URLs.
- Not the App Store build.

## Files

- `index.html` — fully inlined single-file demo (CSS + species + app JS embedded; no external script/link tags — works on raw.githack and similar preview hosts)
- `styles.css` — green/nature mobile UI (source; also inlined in `index.html`)
- `app.js` — flow, mock ID, localStorage (source; also inlined)
- `species.js` — embedded species deck (source; also inlined)
