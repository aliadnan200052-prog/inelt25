#!/usr/bin/env node
// Publish an admin export: validate a content bundle, then write it into
// learn/content/ so it can be committed and deployed.
//
//   node learn/tools/apply-bundle.mjs path/to/learn-content-bundle.json [--force]
//
// Refuses to write when validation finds problems, unless --force.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateCatalog, validateItem, validateLesson } from '../js/data/content-schema.js';

const [file, flag] = process.argv.slice(2);
if (!file) {
  console.error('Usage: node learn/tools/apply-bundle.mjs <bundle.json> [--force]');
  process.exit(2);
}
const bundle = JSON.parse(readFileSync(file, 'utf8'));
if (bundle.format !== 'learn-content-bundle') {
  console.error('Not a content bundle exported from the admin panel.');
  process.exit(2);
}

const itemIds = new Set(bundle.items.map(i => i.id));
const videoIds = new Set(bundle.videos.map(v => v.id));
const lessonIds = new Set(Object.keys(bundle.lessons));
const errors = [
  ...validateCatalog(bundle.catalog, lessonIds),
  ...bundle.items.flatMap(validateItem),
  ...Object.values(bundle.lessons).flatMap(l => validateLesson(l, { itemIds, videoIds })),
];
if (errors.length) {
  console.error(`${errors.length} problem(s):\n  ${errors.join('\n  ')}`);
  if (flag !== '--force') process.exit(1);
}

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'content');
const write = (name, data) => writeFileSync(join(dir, name), JSON.stringify(data, null, 2) + '\n');
write('catalog.json', bundle.catalog);
write('items.json', bundle.items);
write('videos.json', bundle.videos);
write('placement.json', bundle.placement);
write('assessments.json', bundle.assessments);
write('schedules.json', bundle.schedules || []);

mkdirSync(join(dir, 'lessons'), { recursive: true });
for (const [id, body] of Object.entries(bundle.lessons)) write(`lessons/${id}.json`, body);
// Remove lesson files the bundle no longer lists.
for (const f of readdirSync(join(dir, 'lessons'))) {
  if (f.endsWith('.json') && !lessonIds.has(f.slice(0, -5))) unlinkSync(join(dir, 'lessons', f));
}
console.log(`Wrote ${lessonIds.size} lessons, ${bundle.items.length} items, ${bundle.videos.length} videos to learn/content/.`);
