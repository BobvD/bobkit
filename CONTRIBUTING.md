# Contributing To Bobkit

Bobkit is a single-package npm repo. Source skills live once, then build and release tooling packages them for each supported agent runtime.

## Project Layout

```text
.rulesync/skills/      source skills; edit these
rulesync.jsonc         Rulesync target configuration
promptfooconfig.yaml   prompt evals for skill workflow contracts
plugins/claude/        Claude plugin and marketplace manifests
scripts/               package, plugin, changelog, and release helpers
.github/workflows/     CI, Claude marketplace publishing, npm publishing
```

`.claude/`, `.codex/`, and `dist/` are generated. Do not edit them by hand.

## How It Works

```text
   .rulesync/skills/*           <-- source of truth
          |
          |  rulesync generate
          v
   .claude/skills/*             <-- Claude Code
   .codex/skills/*              <-- Codex
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

## Local Checkout Setup

Requirements:

- Node.js 22 or newer.
- npm.
- `gh` or `glab` when manually testing GitHub/GitLab skills.

```bash
git clone https://github.com/BobvD/bobkit.git
cd bobkit
npm install
npm link
bobkit install --dev
```

In dev checkout mode, Bobkit can regenerate Rulesync outputs before linking:

```bash
bobkit install --dev
bobkit update --dev
```

## Common Commands

| Task | Command |
| --- | --- |
| Generate skills for all targets | `npm run rulesync:generate` |
| Check generated output is fresh | `npm run rulesync:check` |
| Run prompt evals | `npm run eval` |
| Run Claude behavior evals | `npm run eval:claude` |
| Build Claude plugin + marketplace artifacts | `npm run build:claude` |
| Build npm package assets | `npm run build:package` |
| Run CI-equivalent checks | `npm run ci` |
| Verify release metadata | `npm run release:check` |

## Adding Or Updating A Skill

1. Edit the source skill under `.rulesync/skills/<skill-name>/SKILL.md`.
2. Use frontmatter `name` and `description` that make the trigger clear to agents.
3. Include invocation guidance when the skill has a memorable command form, for example `$review-mr <url>`.
4. Run `npm run rulesync:generate`.
5. Update `promptfooconfig.yaml` when the skill contract changes or a new skill is added.
6. Run the checks listed below.
7. Update `README.md` if the change affects the public skill catalog or install/use flow.

Keep generated target files out of manual edits. If generated output is stale, change the source skill and regenerate.

## Validation Before A PR

Run the focused checks for the change, and prefer the full set for skill or packaging changes:

```bash
npm run rulesync:check
npm run build:package
npm run build:claude
npm run eval
```

`npm run ci` currently runs the Claude plugin build and prompt evals. Package-specific checks are separate because they validate npm tarball contents.

## Claude Behavior Evals

`npm run eval` is the default free smoke suite. It uses Promptfoo's `echo` provider to verify that every skill has a stable contract test.

`npm run eval:claude` is an opt-in behavior suite that sends each source skill to Claude through Promptfoo's Anthropic provider. It loads the real `.rulesync/skills/<skill>/SKILL.md`, applies a simulated environment, and checks the response with JavaScript assertions. Keep it out of `npm run ci` unless the repository is ready for paid/provider-backed evals on every CI run.

Authenticate one of two ways:

```bash
export ANTHROPIC_API_KEY=...
```

Or log in through Claude Code and let Promptfoo reuse that credential:

```bash
claude /login
npm run eval:claude
```

The Claude eval config sets `apiKeyRequired: false` so a Claude Code session can be used without a separate Anthropic Console key.

## Claude Plugin Testing

Build the local marketplace:

```bash
npm run build:claude
```

Then in Claude Code:

```text
/plugin marketplace add ./dist/claude-marketplace
/plugin install bobkit@bobkit-marketplace
/reload-plugins
/bobkit:create-mr
/bobkit:review-mr https://github.com/OWNER/REPO/pull/123
/bobkit:resolve-mr
/bobkit:feature-brainstorm
/bobkit:vegetable-joke
```

After CI publishes the `claude-marketplace` branch, users can install from GitHub:

```bash
claude plugin marketplace add BobvD/bobkit@claude-marketplace --scope project
claude plugin install bobkit@bobkit-marketplace --scope project
```

## Notes

RTK (`rtk-ai/rtk`) may be a useful optional companion later. It could reduce AI-agent context usage by rewriting noisy shell commands through `rtk`, but it is not required for Bobkit.
