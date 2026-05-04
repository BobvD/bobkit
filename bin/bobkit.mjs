#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readlinkSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const home = os.homedir();
const sourceSkillsDir = path.join(root, '.rulesync', 'skills');
const packageJsonPath = path.join(root, 'package.json');
const distribution = detectDistribution();

const targets = {
  codex: {
    generatedDir: path.join(root, '.codex', 'skills'),
    installDir: path.join(home, '.codex', 'skills'),
  },
  claude: {
    generatedDir: path.join(root, '.claude', 'skills'),
    installDir: path.join(home, '.claude', 'skills'),
  },
};

function main() {
  const args = process.argv.slice(2);
  const command = args[0] ?? 'help';
  const flags = parseFlags(args.slice(1));

  try {
    switch (command) {
      case 'install':
        install(flags);
        break;
      case 'update':
        update(flags);
        break;
      case 'status':
        status();
        break;
      case 'doctor':
        doctor();
        break;
      case 'list':
        listSkills();
        break;
      case 'help':
      case '--help':
      case '-h':
        printHelp();
        break;
      case 'version':
      case '--version':
      case '-v':
        printVersion();
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error(`bobkit: ${error.message}`);
    process.exit(1);
  }
}

function parseFlags(args) {
  const flags = {
    dev: false,
    dryRun: false,
    force: false,
    replace: false,
    targets: ['codex', 'claude'],
  };

  for (const arg of args) {
    if (arg === '--dev') flags.dev = true;
    else if (arg === '--dry-run') flags.dryRun = true;
    else if (arg === '--force') flags.force = true;
    else if (arg === '--replace') flags.replace = true;
    else if (arg === '--codex-only') flags.targets = ['codex'];
    else if (arg === '--claude-only') flags.targets = ['claude'];
    else throw new Error(`Unknown option: ${arg}`);
  }

  return flags;
}

function install(flags) {
  if (shouldGenerate(flags)) {
    runRulesyncGenerate(flags);
  } else if (flags.dryRun) {
    console.log('Would use bundled generated skills; Rulesync is not required.');
  } else {
    console.log('Using bundled generated skills; Rulesync is not required.');
  }

  linkGeneratedSkills(flags);
}

function update(flags) {
  if (!isDevMode(flags)) {
    if (flags.dryRun) {
      console.log('Would tell user to run: npm install -g bobkit@latest && bobkit install');
      return;
    }

    console.log('Bobkit is installed as an npm package.');
    console.log('Update with: npm install -g bobkit@latest && bobkit install');
    return;
  }

  ensureGitRepo();
  const trackedDirty = gitTrackedDirty();

  if (trackedDirty && !flags.force) {
    throw new Error('Bobkit has tracked local changes. Commit/stash them or rerun with --force.');
  }

  if (flags.dryRun) {
    console.log('Would run: git pull --ff-only');
  } else {
    run('git', ['pull', '--ff-only'], { label: 'Updating Bobkit from git' });
  }

  install(flags);
}

function status() {
  console.log(`Bobkit root: ${root}`);
  console.log(`Mode: ${isDevMode({ dev: false }) ? 'dev checkout' : 'npm package'}`);

  if (isDevMode({ dev: false }) && isGitRepo()) {
    const branch = runCapture('git', ['branch', '--show-current']) || '(detached)';
    const commit = runCapture('git', ['rev-parse', '--short', 'HEAD']);
    const upstream = runCapture('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], {
      allowFailure: true,
    });
    const dirty = runCapture('git', ['status', '--porcelain']);

    console.log(`Git: ${branch} @ ${commit}`);
    console.log(`Upstream: ${upstream || '(none)'}`);
    console.log(`Worktree: ${dirty ? 'dirty' : 'clean'}`);
  } else {
    console.log('Git: not used in npm package mode');
  }

  console.log('');
  printSkillTable();
}

function doctor() {
  let failed = false;

  failed = checkCommand('node') || failed;
  if (isDevMode({ dev: false })) {
    failed = checkCommand('git') || failed;
    failed = checkCommand('npm') || failed;
  }

  if (!existsSync(path.join(root, 'package.json'))) {
    failed = true;
    console.log('✗ package.json missing');
  } else {
    console.log('✓ package.json found');
  }

  for (const [name, target] of Object.entries(targets)) {
    if (existsSync(target.generatedDir)) {
      console.log(`✓ generated ${name} skills: ${target.generatedDir}`);
    } else {
      failed = true;
      console.log(`✗ generated ${name} skills missing: run bobkit install`);
    }

    const broken = brokenSymlinks(target.installDir);
    if (broken.length === 0) {
      console.log(`✓ no broken ${name} global skill links`);
    } else {
      failed = true;
      console.log(`✗ broken ${name} global skill links: ${broken.join(', ')}`);
    }
  }

  if (failed) {
    process.exitCode = 1;
  }
}

function listSkills() {
  for (const skill of availableSkills()) {
    console.log(skill);
  }
}

function runRulesyncGenerate(flags) {
  if (flags.dryRun) {
    console.log('Would run: npm run rulesync:generate');
    return;
  }

  run('npm', ['run', 'rulesync:generate'], { label: 'Generating skills with Rulesync' });
}

function linkGeneratedSkills(flags) {
  for (const targetName of flags.targets) {
    const target = targets[targetName];
    if (!target) {
      throw new Error(`Unknown target: ${targetName}`);
    }

    if (!existsSync(target.generatedDir)) {
      throw new Error(`Generated ${targetName} skills missing. Run bobkit install without --dry-run first.`);
    }

    mkdir(target.installDir, flags);

    for (const skillName of generatedSkills(target.generatedDir)) {
      const source = path.join(target.generatedDir, skillName);
      const destination = path.join(target.installDir, skillName);
      linkSkill(source, destination, flags);
    }
  }
}

function linkSkill(source, destination, flags) {
  const stat = lstatOrNull(destination);
  if (stat) {

    if (!stat.isSymbolicLink() && !flags.replace) {
      console.log(`Skip existing non-symlink: ${destination} (use --replace to adopt it)`);
      return;
    }

    if (flags.dryRun) {
      console.log(`Would replace: ${destination}`);
    } else {
      rmSync(destination, { recursive: true, force: true });
    }
  }

  if (flags.dryRun) {
    console.log(`Would link: ${destination} -> ${source}`);
    return;
  }

  symlinkSync(source, destination, 'dir');
  console.log(`Linked: ${destination} -> ${source}`);
}

function printSkillTable() {
  const skills = availableSkills();
  if (skills.length === 0) {
    console.log('No skills found.');
    return;
  }

  for (const skill of skills) {
    const codex = linkStatus(path.join(targets.codex.installDir, skill), path.join(targets.codex.generatedDir, skill));
    const claude = linkStatus(path.join(targets.claude.installDir, skill), path.join(targets.claude.generatedDir, skill));
    console.log(`${skill.padEnd(20)} codex=${codex.padEnd(12)} claude=${claude}`);
  }
}

function availableSkills() {
  if (isDevMode({ dev: false }) && existsSync(sourceSkillsDir)) {
    return skillsInDirectory(sourceSkillsDir);
  }

  return [...new Set([
    ...generatedSkills(targets.codex.generatedDir),
    ...generatedSkills(targets.claude.generatedDir),
  ])].sort();
}

function skillsInDirectory(dir) {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => existsSync(path.join(dir, entry.name, 'SKILL.md')))
    .map((entry) => entry.name)
    .sort();
}

function generatedSkills(dir) {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => existsSync(path.join(dir, entry.name, 'SKILL.md')))
    .map((entry) => entry.name)
    .sort();
}

function linkStatus(destination, expectedSource) {
  const stat = lstatOrNull(destination);
  if (!stat) return 'missing';

  if (!stat.isSymbolicLink()) return 'local-dir';
  if (!existsSync(destination)) return 'broken';

  const resolvedDestination = path.resolve(path.dirname(destination), readlinkSync(destination));
  return resolvedDestination === expectedSource ? 'linked' : 'other-link';
}

function brokenSymlinks(dir) {
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .map((name) => path.join(dir, name))
    .filter((entry) => {
      try {
        const stat = lstatSync(entry);
        return stat.isSymbolicLink() && !existsSync(entry);
      } catch {
        return false;
      }
    })
    .map((entry) => path.basename(entry));
}

function lstatOrNull(filePath) {
  try {
    return lstatSync(filePath);
  } catch {
    return null;
  }
}

function checkCommand(command) {
  const found = runCapture('sh', ['-lc', `command -v ${command}`], { allowFailure: true });
  if (found) {
    console.log(`✓ ${command}: ${found}`);
    return false;
  }

  console.log(`✗ ${command} missing`);
  return true;
}

function mkdir(dir, flags) {
  if (flags.dryRun) {
    console.log(`Would ensure directory: ${dir}`);
    return;
  }

  mkdirSync(dir, { recursive: true });
}

function ensureGitRepo() {
  if (!isGitRepo()) {
    throw new Error('Bobkit update requires this CLI to run from a git checkout.');
  }
}

function shouldGenerate(flags) {
  return isDevMode(flags);
}

function isDevMode(flags) {
  return flags.dev || distribution === 'dev';
}

function detectDistribution() {
  if (process.env.BOBKIT_DISTRIBUTION === 'npm') return 'npm';
  if (process.env.BOBKIT_DISTRIBUTION === 'dev') return 'dev';
  if (existsSync(sourceSkillsDir)) return 'dev';
  return 'npm';
}

function isGitRepo() {
  return runCapture('git', ['rev-parse', '--is-inside-work-tree'], { allowFailure: true }) === 'true';
}

function gitTrackedDirty() {
  const unstaged = runStatus('git', ['diff', '--quiet']);
  const staged = runStatus('git', ['diff', '--cached', '--quiet']);
  return unstaged !== 0 || staged !== 0;
}

function run(command, args, options = {}) {
  if (options.label) {
    console.log(options.label);
  }

  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: options.shell ?? false,
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function runStatus(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'ignore',
  });

  return result.status ?? 1;
}

function runCapture(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    shell: options.shell ?? false,
  });

  if (result.status !== 0) {
    if (options.allowFailure) return '';
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }

  return result.stdout.trim();
}

function printHelp() {
  console.log(`bobkit

Usage:
  bobkit install [--replace] [--dry-run] [--dev] [--codex-only|--claude-only]
  bobkit update  [--force] [--replace] [--dry-run] [--dev] [--codex-only|--claude-only]
  bobkit status
  bobkit doctor
  bobkit list

Commands:
  install   Symlink bundled skills into global Codex/Claude skill dirs.
  update    In npm mode, print the npm upgrade command. In dev mode, pull and refresh.
  status    Show repo revision and global skill link status.
  doctor    Check local prerequisites and broken global skill links.
  list      List available skills.

Options:
  --dev          Force dev checkout behavior and run Rulesync before linking.
  --replace      Replace existing non-symlink skill directories during install/update.
  --force        Allow update when tracked local changes exist.
  --dry-run      Print actions without changing files or running git pull.
  --codex-only   Manage only ~/.codex/skills.
  --claude-only  Manage only ~/.claude/skills.
`);
}

function printVersion() {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  console.log(packageJson.version);
}

main();
