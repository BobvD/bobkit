# Core Guardrails

Bobkit guardrails are provider-neutral policies that adapters can translate into hooks, rules, or review instructions.

## Policies

- Do not read secrets or private environment files unless explicitly required and approved.
- Do not run destructive git commands unless the user explicitly asks for them.
- Do not claim tests passed unless the command was actually run and the result is known.
- Do not broaden a task without surfacing the scope change.
- Do not mark work complete without verification evidence.
