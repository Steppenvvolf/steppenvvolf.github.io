# Project content guide

Project case studies live as JSON files in `src/content/projects/`. The filename is the public slug: `riders-republic.json` becomes `/work/riders-republic`. Keep filenames lowercase and hyphenated. The Astro `projects` collection in `src/content.config.ts` is the schema source of truth; the homepage, work index, and detail pages should query that same collection so they cannot drift into separate copies of project facts.

## Add or update a project

Start from [`project-template.json`](./project-template.json), copy it into `src/content/projects/<slug>.json`, and replace every example value. The template is deliberately outside the content directory and has `published: false`; it is not a real portfolio entry. A record needs the case-study fields (`title`, `tag`, `studio`, `role`, `engine`, `year`, `platform`, `cover`, `coverAlt`, `gallery`, `owned`, `brief`, `problem`, `approach`, `result`, `reflection`, and `discipline`) plus `category`, `featured`, `order`, `summary`, and `published`. `gallery` is the single project-image source and must be present, even when empty. Each gallery entry has a `src`, evidence-based non-empty `alt`, and non-empty `caption`. `links` (objects with a human-readable `label` and absolute `http`/`https` `url`) and `contentStatus` (`legacy` or `reviewed`) are optional. `contentStatus` defaults to `legacy`; set it to `reviewed` only after an owner has checked the claims and disclosure status.

Use `category: "games"` for game projects, `"experiments"` for jams and personal studies, and `"product"` for the two freelance product-design case studies. The work index labels them Games, Experiments and Product design. `order` is the stable display order; `featured` selects a project for featured placements; `summary` is a concise, factual card description. Keep `published` false while a record is incomplete or awaiting review. The collection schema defaults it to false when omitted. The validator requires an explicit boolean, so draft status stays deliberate.

Write only claims that can be verified. Distinguish your own contribution from the team's work, describe outcomes at the level supported by evidence, and do not fill gaps with plausible-sounding details. Existing imported claims have not been independently verified. The owner must refresh dates and current statuses, and confirm wording, roles, client/studio names, shipped status, metrics, and awards before publication. Do not include confidential, unreleased, NDA-protected, or identifying information about people without authorization. If a project cannot be described publicly, leave it out or use only details approved for disclosure. Publishing requires owner review; this content batch is not approved for deployment or a push to `main` today.

## Voice and length

Lead with the work. Use plain section names and one clear thought per paragraph. The homepage introduces the person, shows projects, explains the three areas of practice, and offers contact; detailed process belongs on its own page. Avoid adding a slogan or introductory paragraph to every section.

Keep card summaries to one factual sentence, ideally under 30 words. Name the project, contribution, or result rather than praising the experience. Case studies can be longer when each paragraph explains a specific decision or piece of evidence. Remove repeated claims across `owned`, `brief`, `approach`, and `result`. The comic personality comes primarily from the art, typography, and motion; copy should help visitors understand the work.

## Images and evidence

`cover` and each `gallery[].src` are paths rooted at `public`, written with a leading slash, such as `/assets/projects/example/cover.webp`. An empty `cover` intentionally renders the designed typography panel; leave `coverAlt` empty too, and use that treatment until a real, verified project image is available. A non-empty cover requires evidence-based `coverAlt`. Never substitute an unrelated screenshot just to fill the hero. Keep portfolio exports optimized and use a consistent landscape crop; the current case-study gallery renders at 16:9, so 1600×900 or a larger 16:9 source is a useful target. A cover is used in the case-study hero and should still read when cropped with `object-fit: cover`.

Use `gallery: []` when no verified project media is available. Do not maintain a second `images` list or synthesize gallery entries. Every gallery `src` must point to a real local asset; `alt` must accurately describe visible content, and `caption` must be supported by original media or approved project evidence. Do not infer project identity or personal contribution from an ambiguous image. The validator checks gallery structure and, for published records, local gallery and cover files; it cannot fact-check attribution, caption accuracy, or accessibility.

## Importing content from Claude

Claude can draft a JSON record from approved source material. Ask it to preserve the schema keys, return valid JSON only, keep claims traceable to the supplied facts, and mark uncertain or missing values for human review instead of guessing. Check the result against the source, especially personal ownership, metrics, dates, client names, and outcomes. Save it under the intended slug, keep `published` false during review, and set `contentStatus` to `reviewed` only after owner review. Then run `node scripts/validate-content.mjs` before the owner considers publication. A successful validation checks structure and local image files; it does not fact-check the story or grant permission to disclose it.

## Future content growth

The current fields support a straightforward brief → problem → approach → result → reflection case study. If projects need different section types, migrate deliberately to a typed `sections` array with a small set of schema-validated blocks (for example, text, image, metrics, or quote). Keep blocks structured data rather than embedded HTML, define accessible image text at the same time, and update the collection schema, validator, and every page query together. Avoid adding one-off keys that only one page understands.

## Schema notes

Optional fields: `users`, `flow` (3 to 5 steps), `decisions` (2 to 4 `{title, why}`) and `iteration` (product pages only; they switch the page to the product order: problem, who it is for, my role, main task, key decisions, what changed after testing, outcome, what I'd do next), `approachItems` (list rendered as "What I did"), `coverStat` (`{value, label}`, shown big on the card when there is no cover image; without it the card shows the title), `coverFit` (`cover` or `contain`) and `links` (`{label, url}`).

Body fields (`studio`, `role`, `engine`, `year`, `platform`, `owned`, `brief`, `problem`, `approach`) are required only on published records; `result` and `reflection` may stay empty and their sections are then hidden. Case pages use one fixed order: what I owned, the brief, what I did, outcome, what I took from it, gallery.

Claims must come from the Oct 2026 CV, Stefan's own earlier CVs and portfolios, or his own project documents (see `docs/CONTENT-TO-CONFIRM.md`).
