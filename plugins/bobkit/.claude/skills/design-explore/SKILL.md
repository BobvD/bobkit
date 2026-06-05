---
name: design-explore
description: >-
  Use when a new feature, component, or screen needs UI or visual design.
  Detects the repo's design system (shadcn, Tailwind, CSS variables, component
  library), proposes 3-5 distinct design options in one self-contained HTML
  preview, gets multiple-choice feedback, and locks in a chosen direction that
  feeds the spec and BDD. Trigger for UI-facing work or when named
  design-explore / $design-explore.
---
# Design Explore

Turn a UI-facing feature into one chosen, decision-complete visual design — grounded in the design system the repo already uses, presented as a single self-contained HTML preview of 3-5 distinct options, and narrowed by multiple-choice feedback. The output is a design preview plus a locked-in design record. Do not write production component code, run the app, or install dependencies while using this skill.

## Invocation

Trigger this skill by naming it (`$design-explore` in Codex) or with a natural-language request such as "explore designs for this component". Do not rely on un-namespaced `/design-explore`; some clients reserve slash-prefixed input for built-in commands.

This skill is also invoked automatically from `feature-brainstorm` for UI-facing features — after the approach is chosen and before the engineering lock-in and `write-spec` handoff. The chosen design becomes a locked-in decision that flows into the spec's **Implementation Notes** and, through its acceptance scenarios, into `write-bdd`.

Only run for features with a visible UI surface. For backend, CLI, library, or data-only work, skip this skill.

## Workflow

### 1. Detect the design system

Before proposing anything, inspect the repo and build a **design-system profile**. Do not ask the user what the repo can already tell you. Look for:

- **Framework & component library:** `package.json` deps — shadcn/ui (`components.json`, `@/components/ui`), Radix, Material UI (`@mui/*`), Chakra, Mantine, Ant Design, Headless UI, Bootstrap; styling via Tailwind (`tailwind.config.*` or Tailwind v4 `@theme`), CSS Modules, styled-components, Emotion, Panda, vanilla-extract, or plain CSS.
- **Design tokens:** Tailwind theme (colors, spacing, fonts, radius, shadows), CSS custom properties (`:root { --… }`), `components.json` (shadcn `baseColor`/`cssVars`), or a design-token file. Capture the real values.
- **Typography:** font families and how they load (`next/font`, `@font-face`, a Google Fonts `<link>`), and the type scale.
- **Existing components & patterns:** scan the components directory for buttons, inputs, cards, forms, modals, tables, and navigation. Note spacing, radii, shadow, color usage, density, and the states they already handle. Reuse these before inventing anything.
- **Icons:** lucide, heroicons, react-icons, etc.
- **Brand & theming:** logo, primary/accent colors, marketing or landing pages, favicon, and the dark-mode strategy (class vs `data-` attribute).
- The project constitution at `.bobkit/constitution.md`, if present — honor any design, UX, or accessibility principles it states.

Summarize the profile back to the user in a few lines: the system in use, the key tokens, and the components worth reusing. If the repo has **no design system** (greenfield), say so and propose a modern, accessible default — system fonts or one already-loaded webfont, a neutral token set, and a WCAG-AA palette — flagged as a new baseline the user can keep or replace.

### 2. Clarify design intent (multiple-choice menus)

Ask only what the repo cannot answer and what materially changes the visuals. Use the harness's interactive multiple-choice tool (in Claude Code, the `AskUserQuestion` tool), recommended option first and labeled `(Recommended)`, with a one-line tradeoff per option — never a wall of prose questions. Draw concrete options from the detected system. Likely decisions:

- **Surface type:** form, dashboard card, modal, table, list, empty state, landing section — infer a sensible default from the feature.
- **Layout & density:** compact, comfortable, or spacious.
- **Visual tone:** matches the existing app, a fresh accent, or a bolder direction.
- **Key states to show:** default, loading, empty, error, success — which ones matter for this feature.
- **Responsive priority:** mobile-first, desktop-first, or both equally.

Keep each menu to a tight cluster within the harness's question limit. When a later choice depends on an earlier answer, ask in sequence.

### 3. Generate 3-5 options as one self-contained HTML file

Write a single `design.html` beside where the spec will live (see **Output**). Requirements:

- **All 3-5 variants in one file**, visually separated and clearly labeled (Option A, B, C…), each with a one-line description of its idea and tradeoff.
- **Genuinely distinct** — different layout, hierarchy, and emphasis, not one idea in 3-5 colorways.
- **Self-contained:** an inline `<style>` block (and minimal inline `<script>` only if a state toggle helps); no build step, no external JS, no network calls beyond at most one webfont the repo already uses. It must open directly in a browser.
- **Uses the detected tokens** — real colors, spacing, radius, typography, and component shapes — so the options look like they belong in this app. When greenfield, define the proposed baseline tokens once as CSS custom properties at the top.
- **Shows the key states** chosen in step 2.

Bake in the quality bar below. This is non-negotiable and is what earns a clean Lighthouse / PageSpeed score across performance, accessibility, best practices, and SEO:

- **Semantic, accessible HTML:** landmark elements (`header`, `nav`, `main`, `section`), correct heading order, `label`s tied to inputs, `alt` text, `aria-*` only where needed, visible keyboard focus styles, and logical tab order.
- **Contrast & readability:** all text meets WCAG 2.2 AA (4.5:1 for body, 3:1 for large text and UI components); line length ~45-75 characters, line-height ≥ 1.4, body text ≥ ~16px; never convey meaning by color alone.
- **Responsive:** include `<meta name="viewport">`; the layout holds fluidly from ~320px to desktop; tap targets ≥ 24px (44px preferred).
- **SEO & head:** `<!doctype html>`, `lang`, a `<title>`, and a `<meta name="description">`; a clean document outline. Model the head so the implemented version inherits it.
- **Performance:** no render-blocking heavy assets, no layout-shift patterns, `font-display: swap` or system fonts, CSS-only where possible.
- **Motion:** respect `prefers-reduced-motion`; keep transitions subtle.

Add a short comment block at the top of the file listing which standards each option satisfies, so the choice is auditable.

### 4. Present and get multiple-choice feedback

- Tell the user the file path and that they can open `design.html` in a browser (offer to open it). Do not paste the HTML into the chat.
- Ask for the decision as an interactive multiple-choice menu: which option to carry forward (Option A / B / C… / a mix), plus targeted refinement menus where useful ("tighten the spacing?", "swap the accent?", "Option B's header with Option A's layout?"). List your recommended option first, with a rationale grounded in the detected system and the quality bar.
- Iterate: apply requested tweaks to `design.html` and re-confirm until the user locks one in. Keep all options in the file across iterations (mark the chosen one) so the comparison stays intact.

### 5. Lock in and hand off

Once the user picks a direction:

- Write a short `design.md` record beside the spec capturing: the chosen option and why, the design-system profile it builds on, components reused vs. newly proposed, the key states covered, the accessibility / contrast / SEO / performance commitments, and any open visual questions. Link to `design.html`.
- Pass the chosen design on as a **locked-in decision**:
  - **From `feature-brainstorm`:** return the chosen-design summary so brainstorm folds it into the engineering lock-in and the `write-spec` handoff. `write-spec` records it in **Implementation Notes** (with the `design.html` / `design.md` paths), and the spec's **Acceptance Scenarios** should cover the chosen design's UI states (default, loading, empty, error, success) so `write-bdd` turns them into scenarios.
  - **Standalone:** report the artifact paths and suggest `write-spec` (or `write-bdd`) as the next step.
- Do not write production component code, run the app, or install dependencies.

## Output

- `design.html` and `design.md` beside the feature's spec. If the spec folder does not exist yet (design runs before the spec), create the feature folder the spec will use (for example `specs/<NNN-feature-slug>/`) and put the design files there, then pass that folder to `write-spec` so the spec lands alongside. If the repo already has an established spec or design location, match it.

## Guardrails

- Detection before questions — never ask what the repo already declares.
- Use the repo's real design system; do not impose an unrelated look unless the repo is greenfield or the user asks for a fresh direction.
- Self-contained HTML only — no external JS frameworks, no build step, no network calls beyond at most one already-used webfont.
- Accessibility and contrast are not optional. If a requested look would fail WCAG AA, say so and offer a compliant alternative.
- No production code, no running the app, no dependency installs.
- Do not overwrite an existing `design.html` or `design.md` without asking.
- Keep all options in the single file and present by path — do not paste HTML into the chat.

## Common Failure Modes

- Generating one idea in 3-5 colorways instead of genuinely distinct designs.
- Ignoring the repo's tokens and shipping a generic, Bootstrap-looking mock.
- Pasting large HTML into the chat instead of writing the file and pointing at it.
- Low-contrast "grey on white" text that fails WCAG AA.
- Asking prose questions instead of interactive multiple-choice menus.
- Treating the design as decoration and not capturing the UI states that `write-bdd` needs.
