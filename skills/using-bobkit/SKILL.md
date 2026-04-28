---
name: using-bobkit
description: Bootstrap Bobkit discipline. Use at the start of coding work, planning, implementation, debugging, review, or verification tasks.
license: MIT
---

# Using Bobkit

Bobkit is the workflow layer for disciplined AI-assisted development. Use it to choose the right workflow before touching code.

## Operating Rules

1. Check whether a Bobkit skill applies before planning, coding, debugging, reviewing, or declaring work complete.
2. Prefer a spec-first path for new features and meaningful behavior changes.
3. Keep implementation work tied to an approved plan or a clearly scoped bug report.
4. Use evidence, not confidence, to close work.
5. Respect project instructions above Bobkit when they conflict.

## Skill Routing

- New feature or ambiguous request: use `spec-first-development`.
- Approved plan or task list: use `executing-tasks`.
- Testable behavior change: use `test-driven-development`.
- Completion claim or handoff: use `verification-gate`.
- Review request or pre-merge pass: use `code-review`.
- Bug or failing behavior: use `systematic-debugging`.

## Provider Notes

Provider adapters map Bobkit to each host tool. If a provider lacks native hooks or subagents, follow the skill text and use the closest available mechanism.
