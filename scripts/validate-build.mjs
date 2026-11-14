import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'dist',
);
if (!fs.existsSync(root)) throw new Error('Run npm run build first.');
const errors = [];
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
const pages = walk(root).filter((file) => file.endsWith('.html'));
for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  const name = path.relative(root, page);
  if ((html.match(/<h1(?:\s|>)/g) ?? []).length !== 1)
    errors.push(`${name}: expected one h1`);
  if (!/<title>[^<]+<\/title>/.test(html))
    errors.push(`${name}: missing page title`);
  if (!html.includes('id="main-content"'))
    errors.push(`${name}: missing main landmark target`);
  if (!/<meta name="description" content="[^"]+"/.test(html))
    errors.push(`${name}: missing description`);
  for (const match of html.matchAll(
    /(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g,
  )) {
    const href = decodeURIComponent(match[1]);
    if (href.startsWith('//')) continue;
    const candidate = path.resolve(root, `.${href}`);
    if (!candidate.startsWith(root + path.sep) && candidate !== root) {
      errors.push(`${name}: path escapes dist`);
      continue;
    }
    if (
      !(fs.existsSync(candidate) && fs.statSync(candidate).isFile()) &&
      !fs.existsSync(path.join(candidate, 'index.html'))
    )
      errors.push(`${name}: missing local target ${href}`);
  }
  for (const match of html.matchAll(/href="#([^"]+)"/g)) {
    if (!html.includes(`id="${match[1]}"`))
      errors.push(`${name}: missing anchor #${match[1]}`);
  }
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt(?:=|\s|\/?>)/.test(match[0]))
      errors.push(`${name}: image without alt attribute`);
  }
}
// Client-site board pages: required routes, seven lazy-after-first boards,
// no outbound link, and nothing that says the Trisha site is live.
for (const slug of ['smokhot', 'trisha']) {
  const file = path.join(root, 'work', slug, 'index.html');
  if (!fs.existsSync(file)) {
    errors.push(`work/${slug}: route missing`);
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  const boards = [
    ...html.matchAll(
      /<img\b(?![^>]*dialog-image)[^>]*assets\/projects\/[^>]*>/g,
    ),
  ];
  if (boards.length !== 7) errors.push(`work/${slug}: expected 7 boards`);
  boards.forEach((m, i) => {
    if (!/\bwidth="\d+"/.test(m[0]) || !/\bheight="\d+"/.test(m[0]))
      errors.push(`work/${slug}: board ${i + 1} lacks width/height`);
    if (i > 0 && !/loading="lazy"/.test(m[0]))
      errors.push(`work/${slug}: board ${i + 1} is not lazy`);
  });
  if (/class="case-links"/.test(html))
    errors.push(`work/${slug}: unexpected outbound links`);
}
const trisha = fs.readFileSync(
  path.join(root, 'work/trisha/index.html'),
  'utf8',
);
if (
  /\blive\b|launched|online now/i.test(
    trisha.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' '),
  )
)
  errors.push('work/trisha: must not say the site is live');
if (fs.existsSync(path.join(root, 'cv/stefan-malinovic-level-design-cv.docx')))
  errors.push('removed .docx CV is still in the build');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  `Validated ${pages.length} HTML pages: local links, assets, anchors, titles and image alternatives.`,
);
