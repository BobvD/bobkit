---
name: write-spec
description: Write a feature specification document from a feature idea, brainstorm output, or user request. Use when the user asks to write a spec, PRD, feature spec, requirements doc, or explicitly names write-spec / $write-spec.
targets: ["*"]
codexcli:
  short-description: Write a feature spec using the Spec Kit template
copilot:
  license: MIT
---

# Write Spec

Produce a feature specification document using the `spec-template.md` from GitHub's Spec Kit (MIT License, Copyright GitHub, Inc.) plus one added section, **Implementation Notes**, for locked-in architectural decisions that another AI agent needs to pick up the work without revisiting product decisions.

Do not write implementation code while running this skill. The output is a markdown spec file.

## Invocation

Trigger this skill by naming it (`$write-spec` in Codex) or with a natural-language request such as "use write-spec for this feature". Do not rely on un-namespaced `/write-spec`; some clients reserve slash-prefixed input for built-in commands.

This skill is also invoked as the final step of `feature-brainstorm`, which passes locked-in product and engineering decisions as input.

## Workflow

### 1. Ground the input

- Read the user's feature description, any prior brainstorm output, and any locked-in decisions passed in.
- Inspect repo conventions briefly: existing `specs/` or `docs/` directories, naming patterns, similar feature docs. Match what the repo already does.
- If the feature description is too vague to produce a useful spec (no problem, no audience, no success signal), ask one focused clarifying question before continuing. Do not invent product decisions.

### 2. Choose the spec location

- If a `specs/` directory exists at the repo root, write to `specs/<short-feature-slug>/spec.md`. The slug should be kebab-case (e.g., `login-with-clerk`).
- If a `docs/specs/` or `docs/features/` convention exists, match it.
- If no convention exists, create `specs/<short-feature-slug>/spec.md` and tell the user.
- Never overwrite an existing spec file without asking.

### 3. Fill the template

Use the structure below verbatim. Sections marked `*(mandatory)*` must be filled. Sections marked `*(include if ...)*` are conditional — include only when relevant.

```markdown
# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]` *(optional, only when the repo uses numbered feature branches)*

**Created**: [DATE]

**Status**: Draft

**Input**: User description: "[Original user request]"

## User Scenarios & Testing *(mandatory)*

<!-- Prioritize user stories P1/P2/P3. Each story must be INDEPENDENTLY TESTABLE — implementing just ONE delivers a viable MVP. -->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language.]

**Why this priority**: [Explain the value and why it has this priority level.]

**Independent Test**: [How this can be tested independently, e.g., "Can be fully tested by [specific action] and delivers [specific value]."]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Same structure as User Story 1.]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Same structure as User Story 1.]

---

### Edge Cases

- What happens when [boundary condition]?
- How does the system handle [error scenario]?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST [specific capability]
- **FR-002**: Users MUST be able to [key interaction]
- **FR-003**: System MUST [data requirement]

*Mark unclear items as `[NEEDS CLARIFICATION: ...]` rather than guessing.*

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation detail]
- **[Entity 2]**: [What it represents, relationships to other entities]

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Users can complete account creation in under 2 minutes"]
- **SC-002**: [Measurable metric, e.g., "System handles 1000 concurrent users without degradation"]
- **SC-003**: [User satisfaction or business metric]

## Assumptions

- [Assumption about target users]
- [Assumption about scope boundaries, e.g., "Mobile support is out of scope for v1"]
- [Dependency on existing system or service]

## Implementation Notes

<!-- Locked-in architectural decisions that an implementing AI agent should not re-litigate.
     Each bullet records a choice the user has already made or accepted. -->

- **[Decision area]**: [Chosen option] — [one-line reason or constraint]
- **[Decision area]**: [Chosen option] — [one-line reason or constraint]
- **Out of scope**: [Explicit non-goals for this slice]

---

*Spec structure adapted from [`github/spec-kit`](https://github.com/github/spec-kit) `spec-template.md` (MIT License, Copyright GitHub, Inc.). Generated by an AI agent.*
```

### 4. Filling rules

- **User Story priorities** — assign at most one P1. If everything is P1, the user has not made tradeoffs; ask which is the MVP slice.
- **Acceptance Scenarios** — write them in `Given / When / Then` form. These become the source for `write-bdd` later, so make them concrete (real inputs, real expected outcomes), not paraphrases like "the system works correctly".
- **Functional Requirements** — each FR must be testable. Replace vague verbs like "support" or "handle" with specific behavior. If a requirement is genuinely uncertain, write `[NEEDS CLARIFICATION: <what is unclear>]` instead of guessing.
- **Success Criteria** — measurable means a number or a binary signal. "Users like it" is not measurable; "support ticket volume for X drops by 50%" is.
- **Assumptions** — record any default you chose when the user did not specify (e.g., "Free Clerk plan is sufficient for v1"). This protects the user from silent decisions.
- **Implementation Notes** — only locked-in product/architecture choices that another agent should treat as settled. Examples: which library variant, which auth flow, which UI pattern, what is out of scope. Do not write file-level implementation detail here — that belongs in the implementing agent's plan.

### 5. Report and hand off

After writing the file, report:

- The absolute path to the spec file.
- One-line summary of what the spec covers.
- Any `[NEEDS CLARIFICATION]` markers, with the question the user still needs to answer.
- A handoff line: *"To generate runnable BDD scenarios from these acceptance criteria, run `$write-bdd` (or `/bobkit:write-bdd` in Claude Code) on this spec file."*

## Guardrails

- Do not implement code, edit unrelated files, or scaffold a project while running this skill.
- Do not invent acceptance criteria the user did not approve. If a behavior is undefined, mark it `[NEEDS CLARIFICATION]`.
- Do not silently drop the MIT attribution footer; it must appear in every generated spec.
- Do not overwrite an existing spec file at the target path without explicit user confirmation.
- Do not run `$write-bdd` automatically. Offer it as the next step.
- Do not produce a spec longer than the feature warrants. Empty sections are fine; padded prose is not.

## Common Failure Modes

- Generating vague Functional Requirements ("System MUST handle errors gracefully") instead of testable ones ("System MUST display 'Invalid email' when the email field is malformed").
- Filling every section even when the feature is trivially small. Use `*(include if ...)*` markers to skip irrelevant sections.
- Conflating Acceptance Scenarios (observable, user-facing) with implementation steps (internal).
- Treating Implementation Notes as a full plan. It is a short list of locked-in choices, not a design doc.
