#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { changelogEntry } from './changelog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = readJson('package.json');
const packageLock = readJson('package-lock.json');
const version = packageJson.version;

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/.test(version)) {
  fail(`package.json version is not valid semver: ${version}`);
}

if (packageLock.version !== version) {
  fail(`package-lock.json version (${packageLock.version}) does not match package.json (${version})`);
}

if (packageLock.packages?.['']?.version !== version) {
  fail(`package-lock root package version (${packageLock.packages?.['']?.version}) does not match package.json (${version})`);
}

const entry = changelogEntry(root, version);
if (!entry) {
  fail(`CHANGELOG.md is missing a "## ${version}" entry`);
}

const contentLines = entry.body
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('###'));

if (!contentLines.some((line) => line.startsWith('- '))) {
  fail(`CHANGELOG.md entry for ${version} must include at least one bullet`);
}

console.log(`Release ${version} is ready: package metadata and changelog agree.`);

function readJson(file) {
  return JSON.parse(readFileSync(path.join(root, file), 'utf8'));
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
