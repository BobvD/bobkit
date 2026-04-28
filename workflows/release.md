# Release Workflow

Use when preparing a tagged release or packaged plugin update.

1. Validate the scaffold with `npm run validate`.
2. Compile provider outputs with `npm run compile -- --target all`.
3. Confirm generated outputs are deterministic.
4. Review provider support notes.
5. Record version, compatibility notes, and deferred follow-ups.
