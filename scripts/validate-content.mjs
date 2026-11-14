#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const contentDir = path.join(projectRoot, 'src', 'content', 'projects');
const publicDir = path.join(projectRoot, 'public');
const categories = new Set(['games', 'experiments', 'product']);
// Always required (even on unpublished drafts).
const strings = ['title', 'tag', 'summary'];
// Required to be non-empty only once a record is published. result and
// reflection may stay empty (the page hides those sections) rather than
// carrying invented text.
const publishedStrings = [
  'studio',
  'role',
  'engine',
  'year',
  'platform',
  'owned',
  'brief',
  'problem',
  'approach',
];
const optionalStrings = ['result', 'reflection'];
const required = [
  ...strings,
  'cover',
  'coverAlt',
  'gallery',
  'discipline',
  'category',
  'featured',
  'order',
  'published',
];
const errors = [];
const seenSlugs = new Map();

function report(file, message) {
  errors.push(`${path.relative(projectRoot, file)}: ${message}`);
}

function normalizeSlug(filename) {
  return path
    .basename(filename, '.json')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function checkAsset(value, file, field) {
  if (!value.startsWith('/') || value.startsWith('//')) {
    report(file, `${field} must be a public-root path beginning with /`);
    return;
  }

  const relative = value.slice(1).split('/').join(path.sep);
  const resolved = path.resolve(publicDir, relative);
  if (
    resolved !== publicDir &&
    !resolved.startsWith(`${publicDir}${path.sep}`)
  ) {
    report(file, `${field} points outside public: ${value}`);
    return;
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    report(file, `missing ${field} asset: ${value}`);
  }
}

function isHttpUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') return false;
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

if (!fs.existsSync(contentDir)) {
  console.error(
    `Missing project content directory: ${path.relative(projectRoot, contentDir)}`,
  );
  process.exit(1);
}

const files = fs
  .readdirSync(contentDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
  .map((entry) => path.join(contentDir, entry.name))
  .sort();

if (files.length === 0) errors.push('No project JSON records found.');

for (const file of files) {
  const filename = path.basename(file);
  const slug = normalizeSlug(filename);
  if (seenSlugs.has(slug)) {
    report(
      file,
      `duplicate normalized slug "${slug}" (also ${path.basename(seenSlugs.get(slug))})`,
    );
  } else {
    seenSlugs.set(slug, file);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    report(file, `invalid JSON: ${error.message}`);
    continue;
  }

  if (!data || Array.isArray(data) || typeof data !== 'object') {
    report(file, 'record must be a JSON object');
    continue;
  }

  for (const key of required) {
    if (!(key in data)) report(file, `missing required key "${key}"`);
  }
  for (const key of strings) {
    if (typeof data[key] !== 'string' || data[key].trim() === '') {
      report(file, `"${key}" must be a non-empty string`);
    }
  }
  for (const key of [...publishedStrings, ...optionalStrings]) {
    if (key in data && typeof data[key] !== 'string')
      report(file, `"${key}" must be a string`);
  }
  if (data.published === true) {
    const boards = data.layout === 'boards';
    for (const key of boards
      ? ['studio', 'role', 'engine', 'year', 'platform', 'brief']
      : publishedStrings) {
      if (typeof data[key] !== 'string' || data[key].trim() === '')
        report(file, `"${key}" must be non-empty on a published project`);
    }
  }
  if (typeof data.cover !== 'string') {
    report(
      file,
      '"cover" must be a string (use an empty string for a typography cover)',
    );
  }
  if (typeof data.coverAlt !== 'string') {
    report(file, '"coverAlt" must be a string');
  } else if (typeof data.cover === 'string') {
    const hasCover = data.cover.trim().length > 0;
    const hasCoverAlt = data.coverAlt.trim().length > 0;
    if (hasCover !== hasCoverAlt) {
      report(
        file,
        '"coverAlt" must be non-empty exactly when "cover" is non-empty',
      );
    }
  }
  if ('images' in data) {
    report(
      file,
      '"images" is no longer supported; use "gallery" as the single image source',
    );
  }
  if (
    data.users !== undefined &&
    (typeof data.users !== 'string' || data.users.trim() === '')
  )
    report(file, '"users" must be a non-empty string when provided');
  if (data.flow !== undefined) {
    if (
      !Array.isArray(data.flow) ||
      data.flow.length < 3 ||
      data.flow.length > 5 ||
      data.flow.some((step) => typeof step !== 'string' || step.trim() === '')
    )
      report(file, '"flow" must be 3 to 5 non-empty strings when provided');
  }
  if (data.decisions !== undefined) {
    if (
      !Array.isArray(data.decisions) ||
      data.decisions.length < 2 ||
      data.decisions.length > 4 ||
      data.decisions.some(
        (item) =>
          !item ||
          typeof item.title !== 'string' ||
          item.title.trim() === '' ||
          typeof item.why !== 'string' ||
          item.why.trim() === '',
      )
    )
      report(
        file,
        '"decisions" must be 2 to 4 objects with non-empty title and why when provided',
      );
  }
  if (
    data.iteration !== undefined &&
    (typeof data.iteration !== 'string' || !data.iteration.trim())
  )
    report(file, '"iteration" must be a non-empty string when provided');
  if (
    data.iterationTitle !== undefined &&
    (typeof data.iterationTitle !== 'string' || !data.iterationTitle.trim())
  )
    report(file, '"iterationTitle" must be a non-empty string when provided');
  if (
    data.coverStat !== undefined &&
    (typeof data.coverStat?.value !== 'string' ||
      !data.coverStat.value.trim() ||
      typeof data.coverStat?.label !== 'string' ||
      !data.coverStat.label.trim())
  )
    report(file, '"coverStat" must have non-empty value and label');
  if (
    data.approachItems !== undefined &&
    (!Array.isArray(data.approachItems) ||
      data.approachItems.some((v) => typeof v !== 'string' || !v.trim()))
  )
    report(file, '"approachItems" must be an array of non-empty strings');
  if (
    data.descriptor !== undefined &&
    (typeof data.descriptor !== 'string' || !data.descriptor.trim())
  )
    report(file, '"descriptor" must be a non-empty string when provided');
  if (
    data.coverSmall !== undefined &&
    (typeof data.coverSmall !== 'string' || !data.coverSmall.startsWith('/'))
  )
    report(file, '"coverSmall" must be a public-root path');
  if (data.coverBg !== undefined && typeof data.coverBg !== 'string')
    report(file, '"coverBg" must be a string');
  if (
    data.note !== undefined &&
    (typeof data.note !== 'string' || !data.note.trim())
  )
    report(file, '"note" must be a non-empty string when provided');
  if (
    data.facts !== undefined &&
    (!Array.isArray(data.facts) ||
      data.facts.length === 0 ||
      data.facts.some(
        (row) =>
          !row ||
          typeof row.label !== 'string' ||
          !row.label.trim() ||
          typeof row.value !== 'string' ||
          !row.value.trim(),
      ))
  )
    report(file, '"facts" must be rows with non-empty label and value');
  if (data.layout !== undefined && !['case', 'boards'].includes(data.layout))
    report(file, '"layout" must be case or boards');
  if (
    data.layout === 'boards' &&
    (!Array.isArray(data.gallery) || data.gallery.length === 0)
  )
    report(file, 'boards layout needs a non-empty "gallery"');
  if (
    data.coverPosition !== undefined &&
    (typeof data.coverPosition !== 'string' || !data.coverPosition.trim())
  )
    report(file, '"coverPosition" must be a non-empty string');
  if (
    data.coverFit !== undefined &&
    !['cover', 'contain'].includes(data.coverFit)
  )
    report(file, '"coverFit" must be cover or contain');
  for (const key of ['discipline']) {
    if (
      !Array.isArray(data[key]) ||
      (data.published === true && data[key].length === 0) ||
      data[key].some(
        (value) => typeof value !== 'string' || value.trim() === '',
      )
    ) {
      report(file, `"${key}" must be an array of non-empty strings`);
    }
  }
  if (typeof data.category !== 'string' || !categories.has(data.category)) {
    report(file, '"category" must be games, experiments or product');
  }
  for (const key of ['featured', 'published']) {
    if (typeof data[key] !== 'boolean')
      report(file, `"${key}" must be a boolean`);
  }
  if (typeof data.order !== 'number' || !Number.isFinite(data.order)) {
    report(file, '"order" must be a finite number');
  }
  if (!Array.isArray(data.gallery)) {
    report(
      file,
      '"gallery" must be a required array (use [] when no verified images are available)',
    );
  } else {
    data.gallery.forEach((image, index) => {
      const prefix = `gallery[${index}]`;
      if (!image || Array.isArray(image) || typeof image !== 'object') {
        report(file, `${prefix} must be an object with src, alt, and caption`);
        return;
      }
      for (const key of ['src', 'alt', 'caption']) {
        if (typeof image[key] !== 'string' || image[key].trim() === '') {
          report(file, `${prefix}.${key} must be a non-empty string`);
        }
      }
      if (
        data.published === true &&
        typeof image.src === 'string' &&
        image.src.trim()
      ) {
        checkAsset(image.src, file, `${prefix}.src`);
      }
    });
  }
  if (data.links !== undefined) {
    if (!Array.isArray(data.links)) {
      report(file, '"links" must be an array when provided');
    } else {
      data.links.forEach((link, index) => {
        const prefix = `links[${index}]`;
        if (!link || Array.isArray(link) || typeof link !== 'object') {
          report(file, `${prefix} must be an object with label and url`);
          return;
        }
        if (typeof link.label !== 'string' || link.label.trim() === '') {
          report(file, `${prefix}.label must be a non-empty string`);
        }
        if (typeof link.url !== 'string' || !isHttpUrl(link.url)) {
          report(file, `${prefix}.url must be an absolute http or https URL`);
        }
      });
    }
  }
  if (
    data.contentStatus !== undefined &&
    !['legacy', 'reviewed'].includes(data.contentStatus)
  ) {
    report(file, '"contentStatus" must be legacy or reviewed');
  }

  if (data.published === true) {
    if (typeof data.cover === 'string' && data.cover.trim())
      checkAsset(data.cover, file, 'cover');
  }
}

if (errors.length) {
  console.error(
    `Content validation failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:`,
  );
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(
  `Validated ${files.length} project record${files.length === 1 ? '' : 's'}.`,
);
