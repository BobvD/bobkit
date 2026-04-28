# bobkit

Tiny Bobkit spike: one Rulesync-managed Claude skill, one Promptfoo eval, and a Claude plugin build pipeline.

## What This Contains

- `.rulesync/skills/vegetable-joke/SKILL.md` is the source skill.
- `rulesync.jsonc` tells Rulesync to generate a Claude Code project skill.
- Generated skill copies are ignored; `.rulesync/` is the committed source of truth.
- `promptfooconfig.yaml` checks the vegetable joke prompt contract with Promptfoo's offline `echo` provider.
- `plugins/claude/plugin.json` is the source manifest for the Claude plugin artifact.
- `.github/workflows/claude-plugin.yml` builds the deployable Claude plugin artifact in CI.

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

That creates a deployable artifact at:

```text
dist/claude-plugin/
  .claude-plugin/plugin.json
  skills/vegetable-joke/SKILL.md
```

`dist/` and `.claude/` are generated and ignored. CI runs the same build and uploads `dist/claude-plugin` as an artifact.
