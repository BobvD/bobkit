#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestSource = path.join(root, 'plugins', 'claude', 'plugin.json');
const marketplaceSource = path.join(root, 'plugins', 'claude', 'marketplace.json');
const pluginOutputDir = path.join(root, 'dist', 'claude-plugin');
const marketplaceOutputDir = path.join(root, 'dist', 'claude-marketplace');
const marketplacePluginOutputDir = path.join(marketplaceOutputDir, 'plugins', 'bobkit');
const outputRoots = ['dist/claude-plugin', 'dist/claude-marketplace/plugins/bobkit'];

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

if (!existsSync(marketplaceSource)) {
  console.error('Missing Claude marketplace source: plugins/claude/marketplace.json');
  process.exit(1);
}

rmSync(pluginOutputDir, { recursive: true, force: true });
rmSync(marketplaceOutputDir, { recursive: true, force: true });

run('npm', [
  'run',
  'rulesync:generate',
  '--',
  '--targets',
  'claudecode',
  '--features',
  'skills',
  '--output-roots',
  outputRoots.join(',')
]);

for (const outputRoot of outputRoots) {
  const skillsDir = path.join(root, outputRoot, '.claude', 'skills');
  if (!existsSync(skillsDir)) {
    console.error(`Rulesync did not generate ${path.join(outputRoot, '.claude', 'skills')}.`);
    process.exit(1);
  }
}

mkdirSync(path.join(pluginOutputDir, '.claude-plugin'), { recursive: true });
copyFileSync(manifestSource, path.join(pluginOutputDir, '.claude-plugin', 'plugin.json'));

mkdirSync(path.join(marketplaceOutputDir, '.claude-plugin'), { recursive: true });
copyFileSync(marketplaceSource, path.join(marketplaceOutputDir, '.claude-plugin', 'marketplace.json'));

mkdirSync(path.join(marketplacePluginOutputDir, '.claude-plugin'), { recursive: true });
copyFileSync(manifestSource, path.join(marketplacePluginOutputDir, '.claude-plugin', 'plugin.json'));

console.log('Built Claude plugin artifact: dist/claude-plugin');
console.log('Built Claude marketplace artifact: dist/claude-marketplace');
