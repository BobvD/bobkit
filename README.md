# Bobkit

Tiny Bobkit spike: one Rulesync-managed Claude skill, one Promptfoo eval, and a Claude marketplace build pipeline.

## What This Contains

- `.rulesync/skills/vegetable-joke/SKILL.md` is the source skill.
- `rulesync.jsonc` tells Rulesync to generate a Claude Code project skill.
- Generated skill copies are ignored; `.rulesync/` is the committed source of truth.
- `promptfooconfig.yaml` checks the vegetable joke prompt contract with Promptfoo's offline `echo` provider.
- `plugins/claude/plugin.json` is the source manifest for the Claude plugin artifact and points Claude at generated `.claude/skills`.
- `plugins/claude/marketplace.json` is the source manifest for the Bobkit Claude marketplace.
- `.github/workflows/claude-plugin.yml` builds the deployable Claude plugin and marketplace artifacts in CI.

## Optional RTK

RTK (`rtk-ai/rtk`) may be a useful optional companion for Bobkit later. It can reduce AI-agent context usage by rewriting noisy shell commands through `rtk`, but it is not required for this spike.

## Try It

```bash
npm run rulesync:generate
npm run eval
```

That generates:

```text
.claude/skills/vegetable-joke/SKILL.md
```

To check generated skill files are up to date:

```bash
npm run rulesync:check
```

## Build The Claude Plugin

```bash
npm run build:claude
```

That creates a standalone plugin artifact at:

```text
dist/claude-plugin/
  .claude-plugin/plugin.json
  .claude/skills/vegetable-joke/SKILL.md
```

It also creates a local Claude marketplace artifact at:

```text
dist/claude-marketplace/
  .claude-plugin/marketplace.json
  plugins/bobkit/
    .claude-plugin/plugin.json
    .claude/skills/vegetable-joke/SKILL.md
```

Test the marketplace locally in Claude Code:

```text
/plugin marketplace add ./dist/claude-marketplace
/plugin install bobkit@bobkit-marketplace
/reload-plugins
/bobkit:vegetable-joke
```

On pushes to `main`, CI publishes the generated marketplace to the `claude-marketplace` branch. After that branch exists, install it from another project with:

```bash
claude plugin marketplace add BobvD/bobkit@claude-marketplace --scope project
claude plugin install bobkit@bobkit-marketplace --scope project
```

`dist/` and `.claude/` are generated and ignored. CI runs the same build, uploads both artifacts, and deploys the marketplace branch from generated output rather than committing generated skills to `main`.
