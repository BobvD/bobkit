---
name: feature-brainstorm
description: >-
  Use when a user has a new feature idea, product concept, ambiguous
  requirement, or asks to brainstorm before implementation.
---
# Feature Brainstorm

Turn a rough feature idea into an approved product spec and implementation-ready plan through collaborative questioning. Do not implement, scaffold, or edit product code while using this skill.

## Core Rules

- Ground in the environment before asking questions: inspect repo structure, docs, related features, conventions, and tests when available.
- Ask only questions that materially affect the spec or plan. Do not ask for facts the repo can answer.
- Prefer one decision at a time. Use multiple choice when practical, with a recommended option and short tradeoff descriptions.
- Never silently change scope. Add, defer, or remove scope only after making the tradeoff explicit.
- Present 2-3 viable approaches before committing to one, even when one is clearly best.
- End with a decision-complete spec and plan. The implementer should not need to make product or architecture decisions.

## Workflow

### 1. Context Scan

Before product questions, inspect likely sources of truth:

- Existing feature docs, README, architecture notes, tickets, or plans.
- Similar modules, routes, APIs, components, data models, and tests.
- Project conventions for planning, testing, migrations, UI, release, and generated files.
- The project constitution at `.bobkit/constitution.md`, using the rules below.

Summarize what the repo already tells you. Identify only the remaining decisions that need the user.

#### Constitution check

Read `.bobkit/constitution.md` and pick one of three paths:

- **File missing** → tell the user a constitution would shape this brainstorm and offer to invoke `$write-constitution` now. **Stop and wait for the user's yes/no answer before proceeding** — do not start the product challenge while asking. If the user accepts, invoke `$write-constitution` first, then resume the brainstorm with the new constitution loaded. If the user declines, ask `write-constitution` to write a declined stub (so this prompt does not repeat for 90 days) and continue without a constitution.
- **File is a declined stub** (contains `<!-- declined: YYYY-MM-DD -->` and no `## Core Principles` content with body text). Parse the date. If it is **older than 90 days**, ask once more whether to create a constitution. If still declined, refresh the stub date and continue. If the date is within 90 days, silently skip the prompt and continue.
- **File is a real constitution** → load it. In later steps, when you propose approaches or lock in decisions, name the relevant principles by their Roman-numeral heading (e.g., "This aligns with **I. Smallest Useful Slice**") and flag any tradeoff that conflicts with a principle so the user can confirm the exception.

Do not block the brainstorm on a missing constitution. The check is a nudge, not a gate.

### 2. Product Challenge

Clarify the feature until these are explicit:

- Problem: what pain or opportunity this addresses.
- Audience: who uses it and who is affected by it.
- Outcome: what changes when this ships.
- Success criteria: observable signals that prove it works.
- Non-goals: what is deliberately out of scope.
- Constraints: timing, compatibility, privacy, budget, team, dependencies.

For startup or customer-facing ideas, push for demand reality: current workaround, urgency, narrowest first user, and evidence. For internal, developer, hobby, or open source ideas, push for usefulness, learning value, maintainability, and the smallest satisfying version.

### 3. Approach Selection

Offer 2-3 approaches with a recommendation:

- Minimal: smallest useful version.
- Balanced: practical default that handles the core use case well.
- Ambitious: broader version if the extra scope clearly improves the product.

For each approach, state what it includes, what it skips, main risks, effort, and why you recommend or reject it. Ask the user to choose before treating an approach as accepted.

### 4. Engineering Lock-In

After the approach is chosen, make the implementation shape explicit:

- Interfaces: public APIs, routes, commands, events, schemas, CLI flags, UI states, or file formats that change.
- Data flow: how data moves through the system, including reads, writes, async work, and integrations.
- Edge cases: empty, invalid, duplicate, unauthorized, offline, slow, partial, and failure states relevant to the feature.
- Testing: unit, integration, E2E, visual, migration, or eval coverage needed for confidence.
- Rollout: migration, backfill, feature flag, compatibility, monitoring, docs, or release notes if relevant.

Use ASCII diagrams for non-trivial flows or state machines. If the feature touches UI, identify reusable design-system pieces before proposing new components.

### 5. Hand off to `write-spec`

Once the product approach and engineering shape are locked in, do not produce the final spec inline. Invoke the `write-spec` skill and pass it the locked-in decisions as input:

- Feature title and one-line summary.
- The problem, audience, outcome, success criteria, and non-goals from step 2.
- The chosen approach from step 3.
- The interfaces, data flow, edge cases, testing, and rollout decisions from step 4. These become the spec's **Implementation Notes** section so an implementing AI agent does not re-litigate them.
- Any assumptions or defaults you chose without explicit user input.

`write-spec` writes the spec file and reports the path plus the BDD handoff line. The brainstorm skill's job ends with the handoff — do not re-state what `write-spec` already reported, and do not ask "should I proceed?". The user can request implementation (or `$write-bdd`) after reviewing the spec.

## Common Failure Modes

- Jumping to implementation before the problem and success criteria are clear.
- Asking broad open-ended questions when a concrete multiple-choice decision would be faster.
- Proposing only the recommended solution and hiding tradeoffs.
- Writing a plan that says "handle errors" without naming the actual errors.
- Creating phases that only set up infrastructure and ship no observable value.
- Treating tests as a generic checklist instead of mapping them to user flows and failure modes.
