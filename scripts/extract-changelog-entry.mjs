#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { changelogEntry } from './changelog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const entry = changelogEntry(root, version);

if (!entry?.body) {
  console.error(`CHANGELOG.md is missing release notes for ${version}`);
  process.exit(1);
}

console.log(entry.body);
