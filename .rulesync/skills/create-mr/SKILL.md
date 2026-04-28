---
name: create-mr
description: Create a merge request or pull request for the current git branch. Use when the user asks to create an MR, merge request, PR, pull request, or invokes /create-mr.
targets: ["*"]
codexcli:
  short-description: Create a GitLab MR or GitHub PR
copilot:
  license: MIT
---

# Create MR

Create a merge request or pull request for the current git repository. Prefer doing the work directly with the repository's native CLI after verifying the host.

## Workflow

1. Confirm this is a git repository:
   - Run `git rev-parse --show-toplevel`.
   - If it fails, stop and tell the user this command only works inside a git repo.
2. Identify the remote host:
   - Read remotes with `git remote -v`.
   - If a remote URL contains `github.com`, use GitHub.
   - If a remote URL contains `gitlab.com`, use GitLab.
   - If both are present, prefer the branch's upstream remote from `git rev-parse --abbrev-ref --symbolic-full-name @{u}`. If still ambiguous, ask the user which host to use.
   - If the host is self-hosted or ambiguous, try the available authenticated CLI first: `gh repo view` for GitHub or `glab repo view` for GitLab. If neither identifies the repo, ask the user whether this repo is GitHub or GitLab.
3. Check the required CLI:
   - For GitHub, require `gh`.
   - For GitLab, require `glab`.
   - Check installation with `command -v gh` or `command -v glab`.
   - If the CLI is missing, stop and ask the user to install it. Suggest `brew install gh` or `brew install glab` on macOS, and mention the official package manager docs for other systems.
   - Check authentication with `gh auth status` or `glab auth status`.
   - If the CLI exists but auth is not configured, stop and ask the user to run `gh auth login` or `glab auth login`.
4. Inspect the branch and local state:
   - Run `git branch --show-current`.
   - If on `main`, `master`, or another protected/default branch, ask the user to create or switch to a feature branch first.
   - Run `git status --short` and summarize uncommitted changes. Do not create commits unless the user explicitly asks.
5. Push the branch if needed:
   - If the branch has no upstream, ask before running `git push -u <remote> <branch>`.
   - If the branch has an upstream, run `git push` only when there are local commits not on the remote.
6. Create the request:
   - GitHub: use `gh pr create --fill` by default. If the repo requires a draft, use `--draft`.
   - GitLab: use `glab mr create --fill` by default. If the repo requires a draft, use `--draft`.
   - If the CLI cannot infer base/head, read the default branch from the remote and pass base/head explicitly.
7. Report the URL and any remaining manual steps.

## Guardrails

- Do not install `gh` or `glab` automatically.
- Do not authenticate on the user's behalf.
- Do not push secrets, generated artifacts, or unrelated local changes.
- Do not create a GitHub PR and a GitLab MR for the same branch unless the user explicitly asks for both.
- Use the host language the repo expects: GitHub creates pull requests, GitLab creates merge requests. It is okay that the user said "MR" when the detected host is GitHub; create a PR and explain the mapping briefly.
