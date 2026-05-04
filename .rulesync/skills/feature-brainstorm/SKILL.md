---
name: feature-brainstorm
description: Use when a user has a new feature idea, product concept, ambiguous requirement, or asks to brainstorm before implementation.
targets: ["*"]
codexcli:
  short-description: Brainstorm a feature into a spec and plan
copilot:
  license: MIT
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

Summarize what the repo already tells you. Identify only the remaining decisions that need the user.

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

### 5. Final Spec And Plan

Present the final output in a `<proposed_plan>` block when the host supports it. Keep it concise but decision-complete:

- Title and summary.
- User-facing behavior and success criteria.
- Public API, type, schema, route, or interface changes.
- Implementation changes grouped by subsystem.
- Test scenarios and acceptance criteria.
- Assumptions, defaults chosen, and explicit non-goals.

Do not ask "should I proceed?" in the final output. The user can request implementation after reviewing the plan.

## Common Failure Modes

- Jumping to implementation before the problem and success criteria are clear.
- Asking broad open-ended questions when a concrete multiple-choice decision would be faster.
- Proposing only the recommended solution and hiding tradeoffs.
- Writing a plan that says "handle errors" without naming the actual errors.
- Creating phases that only set up infrastructure and ship no observable value.
- Treating tests as a generic checklist instead of mapping them to user flows and failure modes.
