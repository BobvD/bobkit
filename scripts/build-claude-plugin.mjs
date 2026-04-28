#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generatedSkillsDir = path.join(root, '.claude', 'skills');
const manifestSource = path.join(root, 'plugins', 'claude', 'plugin.json');
const outputDir = path.join(root, 'dist', 'claude-plugin');

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(manifestSource)) {
  console.error('Missing Claude plugin manifest source: plugins/claude/plugin.json');
  process.exit(1);
}

run('npx', ['--yes', 'rulesync@8.13.0', 'generate', '--targets', 'claudecode', '--features', 'skills']);

if (!existsSync(generatedSkillsDir)) {
  console.error('Rulesync did not generate .claude/skills.');
  process.exit(1);
}

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(path.join(outputDir, '.claude-plugin'), { recursive: true });
copyFileSync(manifestSource, path.join(outputDir, '.claude-plugin', 'plugin.json'));
cpSync(generatedSkillsDir, path.join(outputDir, 'skills'), { recursive: true });

console.log('Built Claude plugin artifact: dist/claude-plugin');
