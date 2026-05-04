#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packFile = process.argv[2];

if (!packFile) {
  console.error('Usage: node scripts/verify-packed-package.mjs <pack-json-file>');
  process.exit(1);
}

const [{ files }] = JSON.parse(readFileSync(path.resolve(root, packFile), 'utf8'));
const names = new Set(files.map((file) => file.path));
const skillsDir = path.join(root, '.rulesync', 'skills');
const skills = readdirSync(skillsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .filter((entry) => existsSync(path.join(skillsDir, entry.name, 'SKILL.md')))
  .map((entry) => entry.name)
  .sort();

const required = [
  'bin/bobkit.mjs',
  'README.md',
  'CHANGELOG.md',
  ...skills.flatMap((skill) => [
    `.codex/skills/${skill}/SKILL.md`,
    `.claude/skills/${skill}/SKILL.md`,
  ]),
];

const missing = required.filter((file) => !names.has(file));
if (missing.length > 0) {
  console.error(`Missing from npm package:\n${missing.join('\n')}`);
  process.exit(1);
}

console.log(`Verified ${required.length} required npm package files.`);
