---
name: systematic-debugging
description: Debug failing behavior through reproduction, hypothesis, isolation, and verification. Use for bugs, flaky tests, or unexplained failures.
license: MIT
---

# Systematic Debugging

Use this skill when something is broken or uncertain.

## Process

1. Reproduce the failure or collect the best available evidence.
2. State one hypothesis at a time.
3. Run the smallest test or inspection that can disprove the hypothesis.
4. Fix the root cause, not just the symptom.
5. Add or update regression coverage when practical.
6. Use `verification-gate` before declaring the bug fixed.

Avoid broad rewrites until the root cause is understood.
