# Changelog

All notable changes to Bobkit will be documented in this file.

## 0.1.0 - Skill workflow release

### Added

- Add the `review-mr` skill for GitHub/GitLab pull request and merge request reviews with inline findings.
- Add the `resolve-mr` skill for addressing review comments, replying, resolving threads, and pushing fix commits.
- Add package and CLI guidance for invoking installed Codex skills with `$skill-name` syntax.

### Changed

- Update skill descriptions and prompt contracts so installed skills use explicit skill-name triggers instead of un-namespaced slash commands.

## 0.0.1 - Initial release

### Added

- Add the `bobkit` CLI for installing, updating, listing, and diagnosing local agent skills.
- Package generated Codex and Claude skills so normal npm installs do not need Rulesync.
- Add `--dev` checkout mode for contributors who want Rulesync generation and git-based updates.
- Add npm package asset validation and tag-based GitHub Actions publishing with provenance.
- Add the initial `create-mr`, `feature-brainstorm`, and `vegetable-joke` skills.
