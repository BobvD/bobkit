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
- Default to surfacing decisions as an interactive multiple-choice menu rather than a wall of prose questions. In Claude Code, use the `AskUserQuestion` tool; in other harnesses, use the equivalent structured-choice prompt. Each question gets 2-4 concrete options, the recommended one listed first and labeled `(Recommended)`, with a one-line tradeoff per option. The harness adds an "Other" free-type choice automatically — it does not count toward the 2-4 — so you do not need to supply an open-ended fallback. But when you genuinely cannot predict a sensible option set (e.g. naming, or framing the core problem), a single open question beats fabricated choices.
- Keep each menu focused on closely related decisions. Use the current harness structured-choice limit to batch a tight cluster, but do not pad it with low-value questions just to fill slots. When a later decision depends on an earlier answer, ask in sequence instead.
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

Ask these as menus, not prose. For each open point, offer the most likely answers as options (with your recommended option first) so the user confirms with a click instead of typing a paragraph.

### 3. Approach Selection

Offer 2-3 approaches with a recommendation, presented as a single menu so the user picks one:

- Minimal: smallest useful version.
- Balanced: practical default that handles the core use case well.
- Ambitious: broader version if the extra scope clearly improves the product.

Make each approach one menu option, recommended one first and labeled `(Recommended)`. In the option description state what it includes, what it skips, main risks, and effort; when the breakdown is detailed, put it in the option's `preview` field for a side-by-side comparison so the labels stay scannable. Ask the user to choose before treating an approach as accepted.

### 4. Design Exploration (UI-facing features)

If the chosen approach has a visible UI surface — a new component, screen, form, or layout — invoke the `design-explore` skill before locking in engineering details. It detects the repo's design system, proposes 3-5 distinct options in a self-contained HTML preview, gets multiple-choice feedback, and returns a single locked-in design.

Pass it the feature summary and the chosen approach. Carry its locked-in design (chosen option, the `design.html` / `design.md` paths, and the UI states it covers) into the engineering lock-in and the `write-spec` handoff below. Skip this step entirely for backend, CLI, library, or data-only work.

### 5. Engineering Lock-In

After the approach is chosen, make the implementation shape explicit:

- Interfaces: public APIs, routes, commands, events, schemas, CLI flags, UI states, or file formats that change.
- Data flow: how data moves through the system, including reads, writes, async work, and integrations.
- Edge cases: empty, invalid, duplicate, unauthorized, offline, slow, partial, and failure states relevant to the feature.
- Testing: unit, integration, E2E, visual, migration, or eval coverage needed for confidence.
- Rollout: migration, backfill, feature flag, compatibility, monitoring, docs, or release notes if relevant.

Use ASCII diagrams for non-trivial flows or state machines. If the feature touches UI, build on the design locked in during step 4 rather than re-litigating it here.

### 6. Hand off to `write-spec`

Once the product approach and engineering shape are locked in, do not produce the final spec inline. Invoke the `write-spec` skill and pass it the locked-in decisions as input:

- Feature title and one-line summary.
- The problem, audience, outcome, success criteria, and non-goals from step 2.
- The chosen approach from step 3.
- The locked-in design from step 4 if the feature is UI-facing — the chosen option, the `design.html` / `design.md` paths, and the UI states it covers — so the spec's acceptance scenarios exercise those states.
- The interfaces, data flow, edge cases, testing, and rollout decisions from step 5. These become the spec's **Implementation Notes** section so an implementing AI agent does not re-litigate them.
- Any assumptions or defaults you chose without explicit user input.

`write-spec` writes the spec file and reports the path plus the BDD handoff line. The brainstorm skill's job ends with the handoff — do not re-state what `write-spec` already reported, and do not ask "should I proceed?". The user can request implementation (or `$write-bdd`) after reviewing the spec.

## Common Failure Modes

- Jumping to implementation before the problem and success criteria are clear.
- Dumping several questions as plain text instead of an interactive multiple-choice menu with recommended options.
- Asking broad open-ended questions when a concrete multiple-choice decision would be faster.
- Proposing only the recommended solution and hiding tradeoffs.
- Writing a plan that says "handle errors" without naming the actual errors.
- Creating phases that only set up infrastructure and ship no observable value.
- Treating tests as a generic checklist instead of mapping them to user flows and failure modes.
