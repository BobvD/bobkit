#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generatedSkillsDir = path.join(root, '.claude', 'skills');
const manifestSource = path.join(root, 'plugins', 'claude', 'plugin.json');
const marketplaceSource = path.join(root, 'plugins', 'claude', 'marketplace.json');
const pluginOutputDir = path.join(root, 'dist', 'claude-plugin');
const marketplaceOutputDir = path.join(root, 'dist', 'claude-marketplace');

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

run('npx', ['--yes', 'rulesync@8.13.0', 'generate', '--targets', 'claudecode', '--features', 'skills']);

if (!existsSync(generatedSkillsDir)) {
  console.error('Rulesync did not generate .claude/skills.');
  process.exit(1);
}

function copyPlugin(pluginRoot) {
  mkdirSync(path.join(pluginRoot, '.claude-plugin'), { recursive: true });
  copyFileSync(manifestSource, path.join(pluginRoot, '.claude-plugin', 'plugin.json'));
  cpSync(generatedSkillsDir, path.join(pluginRoot, 'skills'), { recursive: true });
}

rmSync(pluginOutputDir, { recursive: true, force: true });
copyPlugin(pluginOutputDir);

rmSync(marketplaceOutputDir, { recursive: true, force: true });
mkdirSync(path.join(marketplaceOutputDir, '.claude-plugin'), { recursive: true });
copyFileSync(marketplaceSource, path.join(marketplaceOutputDir, '.claude-plugin', 'marketplace.json'));
copyPlugin(path.join(marketplaceOutputDir, 'plugins', 'bobkit'));

console.log('Built Claude plugin artifact: dist/claude-plugin');
console.log('Built Claude marketplace artifact: dist/claude-marketplace');
