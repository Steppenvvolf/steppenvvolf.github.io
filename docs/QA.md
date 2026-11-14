# Redesign verification — 5 October 2026

The local production preview is at `http://127.0.0.1:4322/`. Restart it with `npm run preview -- --host 127.0.0.1 --port 4322` after running a build. For editing, use `npm run dev` on port 4321.

## Automated checks

- `npm run check`: zero errors, warnings, or hints; eight project records validated.
- `npm run build`: 14 static HTML pages plus the sitemap endpoint.
- `npm run validate:build`: all 14 HTML pages pass checks for local links, images, fragment targets, page titles, descriptions, and main landmarks.
- `npm run format:check` and `git diff --check`: pass.

## Browser checks

- All primary pages and eight case-study routes were inspected at 320px; no horizontal overflow.
- Home, work, about, process, contact, and Riders Republic were checked at 768px, 1024px, and 1440px; no horizontal overflow or broken loaded images.
- Mobile menu opens, closes with Escape, and returns focus to its button.
- Category filters show correct project counts, update the URL, and restore the previous filter with browser Back.
- Native image dialog opens, advances images, closes with Escape, and returns focus to the triggering link. Final production check confirms authored image captions.
- Contact email copying reports success. Email inquiry links and PDF targets were inspected without sending messages.
- No browser console errors appeared in the captured development checks.
- Final production homepage screenshots were saved at desktop and 390px mobile sizes.

## Copy and motion follow-up

- Homepage copy shortened, repeated introductions and the redundant process preview removed. About, work, process, contact, and navigation use more direct copy. Career facts remain the imported records.
- Motorcycle entrance and replay checked in the production browser. Sampled screenshots show the approach, lean, and settle; the pre-entrance flash was corrected with a short CSS hold and a script-load fallback.
- At 390px the rider waits until its artwork panel enters view, then settles with replay available. At 320px all five main routes have no horizontal overflow or broken loaded images. Home also checked at 768px, 1024px, and 1440px.
- Scroll progress, ink strokes, panel entrances, rider parallax, and mobile navigation Escape/focus return checked in the browser.
- `npm run test:motion`: three dependency-free tests cover reduced-motion startup, cancellation of a running ride, and cancellation during image decoding. The fixture verifies browser API lifecycle behavior; it does not replace a device vibration or browser media-preference test.
- Physical tap feedback depends on touch-browser support for `navigator.vibrate`; it was not tested on a physical phone. Visual press feedback remains available.

## Review still needed

The portfolio claims are migrated legacy content; refresh dates, current roles, outcomes, and metrics with the owner. The asset provenance map records image corrections and remaining uncertainty. MILC and Steep deliberately use typography covers until verified images are supplied. This is a local redesign for review, not a claim of a completed content audit or accessibility certification.
