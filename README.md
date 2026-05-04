# Bobkit

Bootstrap for shipping AI-agent skills from a single source of truth to multiple targets (Claude Code, Codex, ...) with evals and a marketplace build wired in.

Today it carries three skills: `vegetable-joke`, `create-mr`, and `feature-brainstorm`. The plumbing is the point: drop new skills into `.rulesync/skills/` and the pipeline fans them out everywhere.

## How It Works

```
   .rulesync/skills/*           <-- source of truth (committed)
          |
          |  rulesync generate
          v
   .claude/skills/*             <-- Claude Code (gitignored)
   .codex/skills/*              <-- Codex CLI    (gitignored)
          |
          |  promptfoo eval
          v
   pass / fail on prompt contracts
          |
          |  scripts/build-claude-plugin.mjs
          v
   dist/claude-plugin/          <-- installable plugin
   dist/claude-marketplace/     <-- local marketplace
          |
          |  GitHub Actions on push to main
          v
   claude-marketplace branch    <-- remote install target
```

## Run It

| Task | Command |
| --- | --- |
| Install Bobkit globally | `npm install -g bobkit` |
| Install generated skills globally | `bobkit install` |
| Update Bobkit and refresh global skills | `npm install -g bobkit@latest && bobkit install` |
| Generate skills for all targets | `npm run rulesync:generate` |
| Check generated output is fresh | `npm run rulesync:check` |
| Run prompt evals | `npm run eval` |
| Build plugin + marketplace artifacts | `npm run build:claude` |
| Build npm package assets | `npm run build:package` |
| What CI runs | `npm run ci` |

## Bobkit CLI

The CLI manages Bobkit skills across projects on this machine. Normal users install it from npm:

```bash
npm install -g bobkit
bobkit install
```

The npm package includes pre-generated Codex and Claude skills. `bobkit install` symlinks those bundled skills into:

- `~/.codex/skills`
- `~/.claude/skills`

Useful commands:

```bash
bobkit list       # list available skills
bobkit status     # show package mode and global link state
bobkit doctor     # check prerequisites and broken links
bobkit install    # refresh global symlinks from bundled skills
bobkit update     # print the npm upgrade command
```

For contributors working from a checkout:

```bash
cd ~/Documents/bobkit
npm link
bobkit install --dev
```

In dev checkout mode, Bobkit can regenerate Rulesync outputs before linking:

```bash
bobkit install --dev
bobkit update --dev
```

If a skill already exists as a normal directory, Bobkit will not overwrite it by default. Use `bobkit install --replace` once when you want Bobkit to adopt those existing local copies as symlinks.

## Publishing To npm

The package name is `bobkit`. Release flow:

1. Bump the version in `package.json` and `package-lock.json`, for example `npm version patch --no-git-tag-version`.
2. Add a matching `CHANGELOG.md` entry, for example `## 0.1.0 - ...`.
3. Merge the PR to `main`.
4. The `npm Publish` workflow sees the unreleased version, runs CI, verifies the package tarball, publishes to npm, creates `v<version>`, and creates a GitHub release from the changelog entry.

One-time npm setup is required before the first release: configure npm Trusted Publishing for `BobvD/bobkit` and `.github/workflows/npm-publish.yml` on the `main` branch.

## Optional RTK

RTK (`rtk-ai/rtk`) may be a useful optional companion for Bobkit later. It can reduce AI-agent context usage by rewriting noisy shell commands through `rtk`, but it is not required for this spike.

## Try The Skills Locally

```bash
npm run build:claude
```

Then in Claude Code:

```
/plugin marketplace add ./dist/claude-marketplace
/plugin install bobkit@bobkit-marketplace
/reload-plugins
/bobkit:create-mr
/bobkit:feature-brainstorm
/bobkit:vegetable-joke
```

## Install From Anywhere

After CI publishes the `claude-marketplace` branch:

```bash
claude plugin marketplace add BobvD/bobkit@claude-marketplace --scope project
claude plugin install bobkit@bobkit-marketplace --scope project
```

## Layout

```
.rulesync/skills/      source skills (edit here)
rulesync.jsonc         which targets to generate for
promptfooconfig.yaml   eval config for multi-skill prompt contracts
plugins/claude/        plugin + marketplace manifests
scripts/               build script for Claude artifacts
.github/workflows/     CI: build, eval, publish marketplace branch
```

`.claude/`, `.codex/`, and `dist/` are generated. Never edit them by hand.
