---
name: write-constitution
description: >-
  Write or amend the project's constitution — a small set of named principles
  that shape every feature spec and implementation decision. Use when the user
  asks to write a constitution, set project principles, define engineering
  rules, or explicitly names write-constitution / $write-constitution.
---
# Write Constitution

Produce or amend a project constitution at `.bobkit/constitution.md`. The constitution is a short, durable document of named principles that every later spec, plan, and implementation must respect. Other bobkit skills (currently `feature-brainstorm` and `write-spec`) read it and surface relevant principles during their workflows.

This skill borrows GitHub Spec Kit's `constitution-template.md` (MIT License, Copyright GitHub, Inc.) verbatim. Bobkit does not use the Spec Kit CLI or its multi-phase workflow — only the markdown template.

## Invocation

Trigger this skill by naming it (`$write-constitution` in Codex) or with a natural-language request such as "use write-constitution to set our project principles". Do not rely on un-namespaced `/write-constitution`; some clients reserve slash-prefixed input for built-in commands.

This skill is also offered by `feature-brainstorm` and `write-spec` when no constitution exists.

## Workflow

### 1. Detect existing state

Check `.bobkit/constitution.md`:

- **Does not exist** → first-time write. Proceed to step 2.
- **Exists, contains the declined-stub marker** (an HTML comment of the form `<!-- declined: YYYY-MM-DD -->` and no Core Principles content) → the user previously declined. Tell them you'll replace the stub with a real constitution and proceed to step 2.
- **Exists with real principles** → this is an amendment. Read the current file, summarize the existing principles to the user, and ask which ones to add, remove, or change. Then proceed with the changes only. Bump the version per step 5.

Never overwrite a real constitution without explicit user confirmation. If the user wants a full rewrite, confirm that the previous version will be lost (or offer to archive it to `.bobkit/constitution.v<N>.md`).

### 2. Gather principles

Offer the user **indie-flavored default principles** first. Show all five, with one-line descriptions, and ask which to keep, edit, or replace. The user may add a sixth or seventh if relevant; the template supports it.

Default suggestions for solo indie / solo-dev + AI projects:

1. **Smallest Useful Slice** — Ship the minimum increment that delivers value or learning. Defer everything else to a follow-up cycle. *Why:* keeps shipping cadence high and surfaces real-world feedback before sunk cost.
2. **Validate Before Scale** — For customer-facing features, surface evidence of demand (a landing page, a waitlist, an explicit user ask) before significant build time. *Why:* solo time is the scarce resource; do not spend it on imagined demand.
3. **AI-Readable Code** — Code that a fresh AI agent (or future you) can re-read in five minutes beats code that flexes patterns. Prefer plain over clever. *Why:* the maintainer is usually an AI, and AI agents do worse on clever code than humans do.
4. **Tests Where They Pay** — Cover the happy path and one realistic failure per feature. Skip exhaustive matrix testing unless the cost of a regression is high (auth, billing, data loss). *Why:* test maintenance has compound cost; selective coverage protects the load-bearing paths without slowing iteration.
5. **Dependencies Earn Their Place** — Each new dependency must justify its weight (bundle size, attack surface, maintenance burden). Prefer language standard library and framework primitives. *Why:* every dependency is a future migration, audit, or security advisory.

For each accepted principle, capture: a short Roman-numeral name (e.g., "I. Smallest Useful Slice"), a one-paragraph description, and (optional) a "when to violate" note. Mark principles **NON-NEGOTIABLE** when the user wants them treated as gates (e.g., "Test-First (NON-NEGOTIABLE)").

If the user wants to skip the defaults and define principles from scratch, do that. Do not push back. Equally, if the user wants only two or three principles, that is fine — the template supports a variable count.

### 3. Fill the rest of the template

Use the structure below, adapted from Spec Kit's `constitution-template.md` (https://github.com/github/spec-kit/blob/main/templates/constitution-template.md, MIT License). Keep section names verbatim from the source; fill placeholders with project-specific content.

```markdown
# [PROJECT_NAME] Constitution

## Core Principles

### [PRINCIPLE_1_NAME]

[PRINCIPLE_1_DESCRIPTION]

### [PRINCIPLE_2_NAME]

[PRINCIPLE_2_DESCRIPTION]

<!-- Add or remove principles as the project requires. -->

## [SECTION_2_NAME]

<!-- Examples: Additional Constraints, Security Requirements, Performance Standards. Omit this section if not needed. -->

[SECTION_2_CONTENT]

## [SECTION_3_NAME]

<!-- Examples: Development Workflow, Review Process, Quality Gates. Omit if not needed. -->

[SECTION_3_CONTENT]

## Governance

<!-- How the constitution is amended and enforced.
     For solo projects, the default is: "Amendments take effect when committed to main.
     Each amendment bumps the version per the rules below." -->

[GOVERNANCE_RULES]

**Version**: [CONSTITUTION_VERSION] | **Ratified**: [RATIFICATION_DATE] | **Last Amended**: [LAST_AMENDED_DATE]

---

*Constitution structure adapted from [`github/spec-kit`](https://github.com/github/spec-kit) `constitution-template.md` (MIT License, Copyright GitHub, Inc.). Generated by an AI agent.*
```

### 4. Project name and metadata

- **Project name**: infer from `package.json` `name`, the repo root directory name, or ask the user.
- **Section 2 / Section 3**: skip these by default for solo indie projects unless the user wants them. Most solo projects need Core Principles + Governance only.
- **Governance**: default text for solo projects is `Amendments take effect when committed to the main branch. Each amendment bumps the version per the rules below.` Edit if the user has a different convention.

### 5. Versioning

Use [Semantic Versioning](https://semver.org/) for the constitution itself:

- **MAJOR** — a principle was removed, renamed, or a NON-NEGOTIABLE was added/relaxed.
- **MINOR** — a new principle was added, or a description was materially expanded.
- **PATCH** — wording fix, typo, clarification with no semantic change.

For a brand-new constitution, set `Version: 1.0.0`. For an amendment, bump from the previous version per the rules above. Always update `Last Amended:` to today's date. Do not change `Ratified:` after the first write.

### 6. Write the file

- Create `.bobkit/` if it does not exist (no other files live there yet; the directory is bobkit-managed metadata).
- Write the constitution to `.bobkit/constitution.md`.
- The path is intentionally bobkit-native, not Spec Kit's `.specify/memory/`, because bobkit does not depend on Spec Kit tooling. If a user later adopts Spec Kit on top of bobkit, they can symlink or copy.

### 7. Report

Report:
- The absolute path to the constitution file.
- The principle names that ended up in the document.
- The version (1.0.0 for new, bumped otherwise).
- A one-line reminder that `feature-brainstorm` and `write-spec` will now reference this constitution on every run.

## Decline path (called from another skill)

If `feature-brainstorm` or `write-spec` invokes this skill in "offer mode" and the user declines to create a real constitution, write a **declined stub** to `.bobkit/constitution.md` instead:

```markdown
# Constitution

_None set. Run `$write-constitution` to add project principles._

<!-- declined: YYYY-MM-DD -->
```

Replace `YYYY-MM-DD` with today's date. The marker comment lets other skills detect the declined state and skip the prompt for 90 days. Do not skip writing the stub; without it, the next invocation will re-ask immediately.

## Guardrails

- Do not overwrite a real (non-stub) constitution without explicit user confirmation.
- Do not invent principles the user did not approve. Defaults are a starting menu, not a default acceptance.
- Do not write to `.specify/` or any other path — bobkit uses `.bobkit/constitution.md` only.
- Do not silently drop the MIT attribution footer to `github/spec-kit`.
- Do not modify other files (specs, code, configs) while running this skill. Constitution-only.
- Do not run code, tests, or build commands.

## Common Failure Modes

- Writing five principles when the user only wanted two. The template is flexible; respect the user's count.
- Padding `Section 2` and `Section 3` with placeholder content. Skip these sections by default.
- Forgetting to bump the version on amendments, or bumping the wrong segment (PATCH vs MINOR vs MAJOR).
- Confusing the declined stub with a real constitution. The stub has the `<!-- declined: -->` marker and no `## Core Principles` heading with content.
