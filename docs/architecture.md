# Bobkit Architecture

Bobkit has one canonical core and thin provider adapters.

## Layers

1. Core skills, workflows, agents, guardrails, templates, and evals.
2. Adapter metadata and generated provider-facing files.
3. Project packs that extend or override core behavior without changing core.
4. Validation and evals that treat workflow instructions as behavior-shaping code.

## V0 Boundary

V0 is a runnable scaffold. It validates structure and renders provider files, but it does not yet merge project packs or compile provider-specific hook policies.
