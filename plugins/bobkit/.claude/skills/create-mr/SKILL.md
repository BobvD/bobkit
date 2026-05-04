---
name: create-mr
description: >-
  Create a merge request or pull request for the current git branch. Use when
  the user asks to create an MR, merge request, PR, pull request, or invokes
  /create-mr.
---
# Create MR

Create a merge request or pull request for the current git repository. Prefer doing the work directly with the repository's native CLI after verifying the host.

## Workflow

1. Confirm this is a git repository:
   - Run `git rev-parse --show-toplevel`.
   - If it fails, stop and tell the user this command only works inside a git repo.
2. Identify the remote host from git metadata first:
   - Read remotes with `git remote -v`.
   - If a remote URL contains `github.com`, use GitHub.
   - If a remote URL contains `gitlab.com`, use GitLab.
   - If both are present, try to prefer the branch's upstream remote with `git rev-parse --abbrev-ref --symbolic-full-name @{u}`.
   - If the upstream command fails because no upstream is set, ignore that failure and continue with the remaining signals.
   - If both are present and still ambiguous after checking the upstream remote, ask the user which host to use.
   - If the host is self-hosted or ambiguous, do not run provider CLIs yet. Continue to the CLI checks below, then use authenticated CLI repo detection only after confirming the relevant CLI exists.
3. Check the required CLI before any CLI-based host detection:
   - For known GitHub repos, require `gh`.
   - For known GitLab repos, require `glab`.
   - For ambiguous repos, check both `gh` and `glab` availability before trying either provider's repo detection.
   - Check installation with `command -v gh` or `command -v glab`.
   - If the CLI is missing, stop and ask the user to install it. Suggest `brew install gh` or `brew install glab` on macOS, and mention the official package manager docs for other systems.
   - Check authentication with `gh auth status` or `glab auth status`.
   - If the CLI exists but auth is not configured, stop and ask the user to run `gh auth login` or `glab auth login`.
   - For ambiguous repos only, after installation and auth checks pass, try `gh repo view` or `glab repo view`. If neither authenticated CLI identifies the repo, ask the user whether this repo is GitHub or GitLab.
4. Inspect the branch and local state:
   - Run `git branch --show-current`.
   - If on `main`, `master`, or another protected/default branch, ask the user to create or switch to a feature branch first.
   - Run `git status --short` and summarize uncommitted changes. Do not create commits unless the user explicitly asks.
5. Push the branch if needed:
   - If the branch has no upstream, ask before running `git push -u <remote> <branch>`.
   - If the branch has an upstream, run `git push` only when there are local commits not on the remote.
6. Write the title and description:
   - Use the current user request, relevant conversation context, branch name, commit messages, and diff summary. Useful commands: `git log --oneline @{u}..HEAD`, `git diff --stat @{u}...HEAD`, and `git diff --name-status @{u}...HEAD`.
   - If no upstream exists yet, compare against the default branch instead.
   - Detect issue or ticket identifiers from the branch name, commit messages, user request, or conversation context. Examples: `ABC-123`, `PROJ-456`, `#123`.
   - Title convention: `[TICKET] type(scope): concise summary` when a ticket exists, otherwise `type(scope): concise summary`.
   - Choose `type` from `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `build`, or `perf`.
   - Choose `scope` from the touched module, package, feature, or directory. Keep it lowercase and short.
   - Keep the title strong, specific, and ideally under 72 characters. Do not end it with a period.
   - Keep the description concise and readable. Prefer:

```markdown
## Summary
- What changed.
- Any important user-facing effect.

## Why
- The reason behind the change, using conversation context when available.

## Validation
- Checks run, or `Not run (reason)`.
```

   - Avoid long narratives, generated filler, and implementation trivia. Two to five bullets total is usually enough.
7. Create the request:
   - GitHub: use `gh pr create --title "$title" --body-file "$body_file"` by default. If the repo requires a draft, use `--draft`.
   - GitLab: use `glab mr create --title "$title" --description "$description"` by default. If the repo requires a draft, use `--draft`.
   - If the CLI cannot infer base/head, read the default branch from the remote and pass base/head explicitly.
8. Report the URL and any remaining manual steps.

## Guardrails

- Do not install `gh` or `glab` automatically.
- Do not authenticate on the user's behalf.
- Do not push secrets, generated artifacts, or unrelated local changes.
- Do not create a GitHub PR and a GitLab MR for the same branch unless the user explicitly asks for both.
- Use the host language the repo expects: GitHub creates pull requests, GitLab creates merge requests. It is okay that the user said "MR" when the detected host is GitHub; create a PR and explain the mapping briefly.
