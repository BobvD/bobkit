# Bobkit

Bobkit is a skillset for AI coding agents.

It gives Codex, Claude Code, and other skill-aware agents reusable workflows for real software work: shaping features, opening pull requests, reviewing pull requests, and resolving review feedback. The `bobkit` CLI is the installer that gets those skills onto your machine.

## Install

Requirements: Node.js 22 or newer.

```bash
npm install -g bobkit
bobkit install
```

`bobkit install` symlinks the bundled skills into:

- `~/.codex/skills`
- `~/.claude/skills`

Restart any open agent sessions after installing so they reload available skills.

## Use The Skills

In Codex, call a skill by naming it:

```text
$feature-brainstorm Help me shape a new onboarding feature.
$write-spec for adding email/password login with Clerk.
$write-bdd for the login-with-clerk spec.
$create-mr
$review-mr https://github.com/OWNER/REPO/pull/123
$resolve-mr https://github.com/OWNER/REPO/pull/123
$vegetable-joke
```

Natural-language requests work too:

```text
Use create-mr to open a PR for this branch.
Use resolve-mr on the current pull request.
Tell me a joke about vegetables.
```

Do not rely on un-namespaced commands like `/create-mr` in Codex; slash-prefixed input can be intercepted by the client as a built-in command.

In Claude Code, global skills can be triggered by asking to use the skill by name. Bobkit also ships a Claude plugin:

```bash
claude plugin marketplace add BobvD/bobkit@claude-marketplace --scope project
claude plugin install bobkit@bobkit-marketplace --scope project
```

Then in Claude Code:

```text
/bobkit:create-mr
/bobkit:review-mr https://github.com/OWNER/REPO/pull/123
/bobkit:resolve-mr
/bobkit:feature-brainstorm
/bobkit:write-spec
/bobkit:write-bdd
/bobkit:vegetable-joke
```

## Skill Catalog

| Skill | Use It For | What It Does |
| --- | --- | --- |
| `feature-brainstorm` | Turning a rough product idea into a buildable spec. | Scans the repo context, challenges the requirement, compares approaches, locks in engineering decisions, and hands off to `write-spec` for the final spec document. |
| `write-spec` | Writing a feature specification document. | Produces a spec on disk using GitHub Spec Kit's `spec-template.md` (User Scenarios with P1/P2/P3, Functional Requirements, Success Criteria, Assumptions) plus an Implementation Notes section for locked-in architectural decisions. Suggests `write-bdd` as the next step. |
| `write-bdd` | Turning acceptance scenarios into runnable BDD tests. | Detects the project's BDD/test framework, generates Gherkin `.feature` files and step-definition stubs from a spec, and asks before installing `playwright-bdd` when no framework is present. Generation only — does not run tests. |
| `create-mr` | Opening a pull request or merge request for the current branch. | Detects GitHub or GitLab, checks the native CLI and auth, summarizes the branch diff, pushes when appropriate, and opens the request. |
| `review-mr` | Reviewing a GitHub pull request or GitLab merge request. | Fetches metadata and diff context, reviews only changed lines, and posts concrete inline findings with severity labels. |
| `resolve-mr` | Working through open review comments. | Fetches unresolved threads, classifies each comment, applies scoped fixes, commits, replies, and resolves completed threads. |
| `vegetable-joke` | A tiny example skill. | Tells one short vegetable joke. |

## Bobkit CLI

The CLI is intentionally small. It installs, refreshes, and diagnoses the local skill links.

```bash
bobkit list       # list bundled skills
bobkit status     # show package mode and global link state
bobkit doctor     # check prerequisites and broken links
bobkit install    # refresh global skill links
bobkit update     # print the npm upgrade command
```

To update later:

```bash
npm install -g bobkit@latest
bobkit install
```

If a skill already exists locally as a normal directory, Bobkit will not overwrite it by default. Use `bobkit install --replace` once when you want Bobkit to adopt those existing local copies as symlinks.

## How Bobkit Ships Skills

Bobkit keeps each source skill once under `.rulesync/skills/`, then generates target-specific skills for Codex and Claude Code. Prompt evals check that the generated skills still satisfy their workflow contracts, and CI publishes the npm package plus the Claude plugin marketplace branch.

For development setup, skill authoring, generated files, and build commands, see [CONTRIBUTING.md](CONTRIBUTING.md).

For version bumps and npm publishing, see [RELEASING.md](RELEASING.md).

## Links

- [Changelog](CHANGELOG.md)
- [Issues](https://github.com/BobvD/bobkit/issues)
