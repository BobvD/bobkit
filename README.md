# Bobkit

Bootstrap for shipping AI-agent skills from a single source of truth to multiple targets (Claude Code, Codex, …) — with evals and a marketplace build wired in.

Today it carries a toy skill (`vegetable-joke`) and a workflow skill (`feature-brainstorm`). The plumbing is the point: drop new skills into `.rulesync/skills/` and the pipeline fans them out everywhere.

## How It Works

```
   .rulesync/skills/*           <-- source of truth (committed)
          │
          │  rulesync generate
          ▼
   .claude/skills/*             <-- Claude Code (gitignored)
   .codex/skills/*              <-- Codex CLI    (gitignored)
          │
          │  promptfoo eval
          ▼
   pass / fail on prompt contracts
          │
          │  scripts/build-claude-plugin.mjs
          ▼
   dist/claude-plugin/          <-- installable plugin
   dist/claude-marketplace/     <-- local marketplace
          │
          │  GitHub Actions on push to main
          ▼
   claude-marketplace branch    <-- remote install target
```

## Run It

| Task | Command |
| --- | --- |
| Generate skills for all targets | `npm run rulesync:generate` |
| Check generated output is fresh | `npm run rulesync:check` |
| Run prompt evals | `npm run eval` |
| Build plugin + marketplace artifacts | `npm run build:claude` |
| What CI runs | `npm run ci` |

## Try The Skill Locally

```bash
npm run build:claude
```

Then in Claude Code:

```
/plugin marketplace add ./dist/claude-marketplace
/plugin install bobkit@bobkit-marketplace
/reload-plugins
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
promptfooconfig.yaml   eval config
plugins/claude/        plugin + marketplace manifests
scripts/               build script for Claude artifacts
.github/workflows/     CI: build, eval, publish marketplace branch
```

`.claude/`, `.codex/`, and `dist/` are generated — never edit by hand.
