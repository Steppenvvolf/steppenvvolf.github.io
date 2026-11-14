# Design direction

## Positioning

Present Stefan Malinovic as a level and game designer open to studio roles. **Steppenwolf** is the primary brand; **Stefan Malinovic** is the secondary, human identity. The work should feel like an underground comic brought to life: loud, illustrated, raw, and unmistakably professional. Use the original bike artwork as a signature visual, not a generic stock-photo substitute.

Personal context may communicate that Stefan is a father and husband, but do not reveal family members' names, images, routines, locations, or other identifying details.

## Visual system

- Palette (dark comic theme): warm near-black `--bg #131211`, `--panel #1d1b19`, `--panel-2 #26231f`; cream `#f0e7d5` for headings, strokes and frames; body text `#cfc5b4`; muted labels `#a39a8b`; vermilion fill `#b83525` (cream text on it) and `#ee5a44` when vermilion is text; gold `#f2ca46` as the main highlight (second headline line, numbers, tags, focus ring). Sections alternate `--bg` and `--panel`; the facts bar uses `--panel-2`. One gold band (the marquee, dark text) and one vermilion band (the call to action) break the dark.
- Three-family system: Anton for display and section headings (upright), Oswald for labels and interface text, Inter for body copy. Bangers is reserved for exactly two places: the hero speech bubble and the "Ride again" burst.
- One type scale (`--fs-12` to `--fs-144`) and one 4/8 spacing scale (`--s-1` to `--s-9`) as CSS variables in `src/styles/global.css`; no text under 12px, uppercase labels at 12px with letter-spacing of 0.1em or less, WCAG AA contrast on every pair.
- Shadow language: the hard shadow marks things you can press (buttons, project cards, download cards). Static cards carry none.
- Arrows: → internal, ↗ external or new tab, ↓ download.
- Comic language, with restraint: 2px cream frames on cards and images, hard offset shadows with no blur (vermilion at rest, gold on hover) only on things you can press, halftone dots as a quiet texture on section backgrounds and strongly on the hero art panel, tags as small stickers tilted at most 2 degrees, the speech bubble and the burst. No texture images behind paragraphs.
- Contrast is checked per pair: cream on bg 15.2, body on bg 11.0, muted on bg 6.7, vermilion text on bg 5.5 (panel-2 4.6), gold on bg 11.9, cream on vermilion fill 4.8, dark ink on gold 11.4.
- Favor bold type, hand-drawn/illustrated energy, halftone texture, clear hierarchy, and direct layouts. Keep long case-study text easy to read and interactive controls accessible.
- Let real project imagery carry the visual weight. When image provenance is unknown, use the designed typography cover; never fill the space with an unrelated screenshot.

## Portfolio structure and story

Games stay primary. Work categories: **Games**, **Experiments** (jams and personal studies) and, clearly secondary and listed last, **Product design** (two freelance UI/UX case studies, Waylo and Qponko). The home page shows only games in Selected work, with a compact product-design strip below it.

Case studies should make the contribution legible: the brief, design problem, decisions and process, outcome, and reflection. Separate Stefan's own work from team outcomes. Use editorial themes to connect projects—spatial readability, player guidance, authored moments, systemic design, iteration, and shipping—only where the project evidence supports the connection.

The site serves hiring teams. Let each quickly understand the work, Stefan's role, and how to contact him without making the portfolio read as a generic résumé or sales brochure.

## Motion and interaction

Keep the approved composition and illustration. The homepage rider enters from the right, leans, and settles with brief speed lines and dust. It runs once when the artwork first enters view, including on mobile; the yellow “Ride again” badge replays it. The scroll response moves the rider and paper dots at different speeds. Project panels enter with a short stagger, headings get an ink stroke, and the rock hand stamps into view. Use tactile press states on controls and a small reading-progress rule.

Motion uses native browser APIs in `src/scripts/hero-motion.ts` and `src/scripts/motion.ts`; no animation framework is required. Use `data-reveal` on a block wrapper, `data-reveal-order` for a short stagger, and `data-ink` on a heading to extend the system. Keep transforms off the same element as an existing hover transform. Base content remains visible without JavaScript. The rider's initial CSS hold has a timed fallback if the entrance script fails to load.

Respect reduced motion at startup and when it changes: cancel active effects, remove scroll transforms, and disable replay. Avoid looping attention effects, scroll hijacking, or automatic sound. Physical tap feedback is optional through `navigator.vibrate` on supporting touch browsers; visual feedback must carry the interaction everywhere.
