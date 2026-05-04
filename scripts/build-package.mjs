#!/usr/bin/env node

import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('npm', ['run', 'rulesync:generate']);

const skillsDir = path.join(root, '.rulesync', 'skills');
const skills = readdirSync(skillsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .filter((entry) => existsSync(path.join(skillsDir, entry.name, 'SKILL.md')))
  .map((entry) => entry.name)
  .sort();

const requiredFiles = skills.flatMap((skill) => [
  `.codex/skills/${skill}/SKILL.md`,
  `.claude/skills/${skill}/SKILL.md`,
]);

for (const file of requiredFiles) {
  if (!existsSync(path.join(root, file))) {
    console.error(`Missing package file: ${file}`);
    process.exit(1);
  }
}

console.log('Bobkit package assets are ready.');
