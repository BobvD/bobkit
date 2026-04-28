---
name: verification-gate
description: Verify work before completion. Use before claiming a task, feature, bug fix, or review response is done.
license: MIT
---

# Verification Gate

Completion requires evidence.

## Required Checks

1. Confirm the requested behavior is implemented.
2. Confirm no unrelated scope was added.
3. Run the focused verification for the changed area.
4. Run broader project checks when the blast radius justifies it.
5. Report exact commands and results.

## Completion Report

Use `templates/verification-report.md`. Include deferred checks and why they were deferred.
