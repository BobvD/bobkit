# Bobkit

Bobkit is a portable workflow kit for AI coding agents. It helps agents plan better, work safer, verify harder, and ship through repeatable project workflows.

Bobkit is provider-neutral at the core. Provider-specific files for Claude Code, Codex, Gemini CLI, OpenCode, Cursor, and GitHub Copilot are generated from the same canonical scaffold.

## Status

This repository is at V0: a runnable scaffold, not a full compiler. The scaffold includes:

- Core workflow skills in `skills/`
- Workflow and agent contracts in `workflows/` and `agents/`
- Guardrail policy references in `guardrails/`
- Provider adapter metadata in `adapters/`
- Promptfoo eval skeletons in `evals/`
- A zero-dependency Node ESM CLI in `scripts/bobkit.mjs`

## Quick Start

```bash
npm run validate
npm run compile -- --target all
```

The compile step renders provider-facing files such as `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, `gemini-extension.json`, `.opencode/plugins/bobkit.js`, Cursor rules and commands, and GitHub Copilot instructions and skills.

## CLI

```bash
node scripts/bobkit.mjs validate
node scripts/bobkit.mjs compile --target all
node scripts/bobkit.mjs compile --target claude
node scripts/bobkit.mjs compile --target codex
node scripts/bobkit.mjs compile --target gemini
node scripts/bobkit.mjs compile --target opencode
node scripts/bobkit.mjs compile --target cursor
node scripts/bobkit.mjs compile --target copilot
```

The CLI intentionally uses only Node built-ins. Machine-readable configuration lives in `bobkit.json`; Markdown and YAML-like files are human-facing unless a future compiler explicitly supports them.

## Repository Layout

- `bobkit.json` - canonical package metadata and adapter registry
- `skills/` - reusable agent skills using `SKILL.md`
- `workflows/` - provider-neutral workflow contracts
- `agents/` - provider-neutral subagent role prompts
- `guardrails/` - safety policies and schema references
- `templates/` - reusable artifact templates
- `packs/` - project-pack placeholders and examples
- `adapters/` - provider adapter metadata
- `evals/` - Promptfoo skeleton suites and fixtures
- `docs/` - architecture, provider support, and pack authoring notes

## Design Principles

- Keep Bobkit core project-neutral.
- Put provider-specific behavior in adapters.
- Treat skills as behavior-shaping code, so validate and evaluate them.
- Prefer deterministic scripts over handwritten generated files.
- Let project packs add context without contaminating core.
