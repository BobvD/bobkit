---
name: write-bdd
description: Generate Gherkin .feature files and step-definition stubs from a feature spec or freeform description. Use when the user asks to write BDD scenarios, Cucumber tests, Playwright BDD tests, generate .feature files, or explicitly names write-bdd / $write-bdd.
targets: ["*"]
codexcli:
  short-description: Generate BDD .feature files and step stubs
copilot:
  license: MIT
---

# Write BDD

Generate executable BDD scenarios as Gherkin `.feature` files plus step-definition stubs from either a feature spec produced by `write-spec` or a freeform feature description. Generation only — this skill does not run the tests.

## Invocation

Trigger this skill by naming it (`$write-bdd` in Codex) or with a natural-language request such as "use write-bdd to generate scenarios for the login feature". Do not rely on un-namespaced `/write-bdd`; some clients reserve slash-prefixed input for built-in commands.

This skill is suggested at the end of `write-spec` runs, but it is fully usable on its own — pass a spec file path, a feature description, or point it at an existing feature.

## Workflow

### 1. Locate the input

The input can be any of:

- A path to a spec file produced by `write-spec` (preferred — reuses the Acceptance Scenarios).
- A freeform feature description in the user request.
- A pointer to an existing feature in the code that should get retroactive scenarios.

If the input is ambiguous, ask the user to clarify before continuing. Do not invent scenarios.

### 2. Detect the testing setup

Inspect the repository to figure out which BDD or test framework is already in use:

- Read `package.json` `devDependencies` and `dependencies` for: `playwright-bdd`, `@cucumber/cucumber`, `@playwright/test`, `cypress-cucumber-preprocessor`, `cucumber`, `cucumber-js`.
- Check for existing directories: `features/`, `tests/features/`, `e2e/features/`, `tests/bdd/`, `cypress/e2e/`.
- Check for a `playwright.config.ts|js`, `cucumber.js`, `cucumber.json`, or similar config.
- Pick the existing convention. Match the repo, do not invent a new layout.

If multiple BDD-ish frameworks coexist, ask the user which to extend.

### 3. Handle the "no BDD framework installed" case

If the repo has no BDD framework at all:

- Name the recommended dependency explicitly: `playwright-bdd` (https://github.com/vitalets/playwright-bdd) — it lets `.feature` files run through Playwright's runner.
- If `@playwright/test` is already present, mention that `playwright-bdd` layers on top.
- Otherwise mention both `@playwright/test` and `playwright-bdd` would need to be installed.
- Ask the user whether to install before doing anything else. Do not install packages without confirmation.
- If the user declines, stop and tell them what would be generated if they reconsider. Do not write `.feature` files into a repo that has no way to run them, unless the user explicitly asks for the files anyway.

### 4. Generate the `.feature` file(s)

Default to **one `.feature` file per spec**, containing one `Scenario:` per Acceptance Scenario across all User Stories. Multiple `Scenario:` blocks inside a single `Feature:` is idiomatic Gherkin, avoids filename collisions, and lets `@P1`/`@P2`/`@P3` tags filter subsets at run time.

- File name: `<feature-slug>.feature` (kebab-case from the spec title, e.g., `tests/features/login-with-clerk.feature`).
- If the spec is large enough that the resulting file exceeds ~200 lines, split it into `<feature-slug>-<story-slug>.feature` per User Story. Never write multiple stories to the same filename in a single run.
- Use standard Gherkin syntax compatible with both Cucumber.js and playwright-bdd:

```gherkin
Feature: [Feature title from spec]

  As a [persona from the user story]
  I want [the capability]
  So that [the value]

  Background:
    Given [shared precondition, if any]

  @P1
  Scenario: [Concrete scenario title, one per Acceptance Scenario in the spec]
    Given [initial state]
    When [action]
    Then [expected outcome]

  @P1
  Scenario Outline: [Title for parameterized cases, when scenarios vary by input]
    Given <input> in the form
    When the user submits
    Then the result is <result>

    Examples:
      | input          | result        |
      | valid@x.com    | success page  |
      | malformed      | error toast   |
```

- Tag each scenario with `@P1`, `@P2`, or `@P3` from the spec's User Story priorities so the user can run priority-filtered subsets.
- One scenario per Acceptance Scenario in the spec. Do not collapse multiple scenarios into one or invent new ones not in the spec.

### 5. Generate step-definition stubs

For each unique step phrase across the generated feature files, emit a stub in the project's step-definitions directory (e.g., `tests/features/steps/<feature-slug>.steps.ts`).

- Use the framework's idiomatic syntax. For `playwright-bdd`:

```ts
import { createBdd } from 'playwright-bdd';
const { Given, When, Then } = createBdd();

Given('the user is on the sign-in page', async ({ page }) => {
  // TODO: implement
  throw new Error('step not implemented');
});
```

- For `@cucumber/cucumber`:

```ts
import { Given, When, Then } from '@cucumber/cucumber';

Given('the user is on the sign-in page', async function () {
  // TODO: implement
  throw new Error('step not implemented');
});
```

- Every stub must throw or fail by default so scenarios are red until the dev fills in the body. Do not stub a passing implementation.
- Match the project's existing language (TypeScript vs JavaScript) and module style (ESM vs CommonJS).
- Do not duplicate step definitions that already exist elsewhere in the project — check before writing.

### 6. Report and stop

After generating files, report:

- Each file created, with its absolute path.
- Counts: number of feature files, number of scenarios, number of step stubs.
- The exact command the user can run to execute these tests (e.g., `npx bddgen && npx playwright test` for playwright-bdd, or `npx cucumber-js` for Cucumber.js).
- A reminder that all step bodies are unimplemented and will fail until filled in.

Do not run the tests. Do not edit unrelated files. Do not modify the spec file.

## Guardrails

- Do not install dependencies without explicit user confirmation, even if the framework is missing.
- Do not run the generated scenarios. Generation only.
- Do not invent acceptance criteria not present in the spec or user description. If a scenario is underspecified, mark it with a `# TODO:` comment in the `.feature` file and report it.
- Do not write `.feature` files outside the detected test directory.
- Do not edit existing `.feature` files unless the user explicitly asks. Create new files or ask before overwriting.
- Do not stub passing step definitions — every stub must fail by default.
- Do not change the spec or its Acceptance Scenarios. If the spec is wrong, surface that and stop.

## Common Failure Modes

- Generating vague Gherkin steps like "When the user does the thing" instead of concrete, observable phrases that map to a real selector or assertion.
- Collapsing multiple acceptance scenarios into one mega-scenario, making failure attribution impossible.
- Creating step stubs that silently `return` instead of throwing, so the test reports green while doing nothing.
- Installing `playwright-bdd` or `@cucumber/cucumber` without asking, then writing files the user did not approve.
- Writing scenarios for behavior the spec did not authorize, padding coverage with imagined cases.
