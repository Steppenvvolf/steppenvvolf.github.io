# Steppenwolf — Stefan Malinovic's portfolio

An Astro 6 static portfolio for level and game design. The current redesign is awaiting owner design and content review; the configured GitHub Pages workflow deploys pushes to `main`, but this redesign is not being presented as live.

## Work locally

Open this repository at `C:\Users\Kaizen\OneDrive\Documents\ChatGPT\Steppenwolf Website`. Use Node 24 (`.nvmrc` pins 24.14.1; the package engine requires `>=24.14.1 <25`), then install the lockfile dependencies and start Astro:

```sh
npm ci
npm run dev
```

Astro serves the local site at `http://localhost:4321`. The commands below cover the project checks:

| Command                  | Purpose                                          |
| ------------------------ | ------------------------------------------------ |
| `npm run check`          | Astro/type checks and project-content validation |
| `npm run format:check`   | Check Prettier formatting                        |
| `npm run build`          | Generate the static site in `dist/`              |
| `npm run validate:build` | Verify generated routes and asset references     |
| `npm run test:motion`    | Check reduced-motion and async animation cleanup |
| `npm run preview`        | Preview the generated site locally               |

## Where things live

- `src/content/projects/*.json` — one case-study record per slug; schema is in `src/content.config.ts`.
- `src/data/site.ts` — portfolio identity, navigation categories, and shared site links.
- `src/pages/` — homepage, about/process/contact pages, work index, and `/work/<slug>` detail route.
- `src/components/` and `src/layouts/` — shared cards, gallery, header/footer, and page shell.
- `src/styles/` — global design tokens and page styles.
- `src/scripts/` — shared scroll effects and the homepage motorcycle entrance.
- `public/` — public images, CV/portfolio PDFs, icons, and other static assets.
- `docs/CONTENT-GUIDE.md` — authoring and publishing guidance; `docs/ASSET-PROVENANCE.md` tracks reviewed image attribution.

The project collection powers the homepage, work index, and detail pages. Add project content through JSON and follow the content guide; keep draft records unpublished until the owner reviews claims, image provenance, and disclosure.

## Deployment

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on pushes to `main` (and manual workflow dispatch). A push to `main` is a deployment action. The current redesign is awaiting owner review, so do not treat the configured destination or workflow as approval to publish it.
