---
name: resolve-mr
description: Resolve open review comments on a merge request or pull request — read each comment, decide if it's correct, apply fixes in code, commit, then reply and mark the thread resolved. Use when the user asks to address/resolve MR or PR comments, invokes /resolve-mr, or shares a PR/MR link asking to fix the feedback.
targets: ["*"]
codexcli:
  short-description: Address open MR/PR review comments — fix, commit, reply, resolve
copilot:
  license: MIT
---

# Resolve MR

Address open review comments on a merge request or pull request. For each unresolved comment, judge whether it is correct, apply the fix in code (or push back politely if it's wrong), commit, reply, and mark the thread resolved on the platform. Detect the host from the URL or current branch, use the native CLI for everything, and report what was applied vs. disputed at the end.

## Workflow

### 1. Resolve the target MR/PR

Two modes:

- **URL given:** parse it the same way `/review-mr` does:
  - GitHub: `https://<github-host>/<owner>/<repo>/pull/<number>` → host=github, capture hostname, owner, repo, number; build `repo_arg` (`<owner>/<repo>` for `github.com`, `<github-host>/<owner>/<repo>` for Enterprise).
  - GitLab: `https://<gitlab-host>/<group>(/<subgroup>)*/<repo>/-/merge_requests/<iid>` → host=gitlab, capture hostname, full project path, IID, full project URL.
  - Anything else: stop and ask the user to confirm the host.
  - Fetch request metadata, including source branch and head SHA (`gh pr view ... --json headRefName,headRefOid` or the GitLab MR version refs).
  - Confirm the local checkout is the request's source branch and `git rev-parse HEAD` matches the request head SHA before applying fixes. If it does not match, stop and ask the user to check out and update the PR/MR head branch.
- **No URL given:** detect from the current branch.
  - Confirm git repo with `git rev-parse --show-toplevel`.
  - Read `git remote -v`; prefer the upstream remote of the current branch (`git rev-parse --abbrev-ref --symbolic-full-name @{u}`) when set.
  - Get the current branch with `git branch --show-current`. If on `main`/`master`/default, stop and ask the user to switch to the feature branch.
  - Find the open request:
    - GitHub: `gh pr list --head <branch> --state open --json number,url,headRefOid,baseRefName,headRefName` (gh defaults to the current repo).
    - GitLab: `glab mr list --source-branch <branch> --state opened` (glab defaults to the current repo).
  - 0 results: stop and tell the user — suggest pushing the branch or passing a URL.
  - 1 result: use it.
  - 2+ results: list them and ask the user which one.
  - If the branch has an upstream, warn when `git rev-list @{u}..HEAD` shows local commits not on the remote — the diff the comments anchor to may not include them.

### 2. Verify the CLI

- GitHub → require `gh`. GitLab → require `glab`.
- Check installation with `command -v gh` / `command -v glab`. If missing, stop and ask the user to install (suggest `brew install gh` / `brew install glab` on macOS, official docs elsewhere). Do not install on the user's behalf.
- Check auth with `gh auth status --hostname <host>` / `glab auth status --hostname <host>`. If unauthenticated, stop and ask the user to run `gh auth login` / `glab auth login` for that hostname.

### 3. Fetch unresolved comments

Pull threads, not single comments — you need the whole conversation to decide.

#### GitHub (GraphQL — `gh pr view` does not expose `isResolved`)

```bash
gh api graphql --hostname <github-host> \
  -F owner=<owner> -F repo=<repo> -F number=<number> \
  -F after=null \
  -f query='
  query($owner: String!, $repo: String!, $number: Int!, $after: String) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        id
        headRefOid
        reviewThreads(first: 100, after: $after) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            isResolved
            isOutdated
            path
            line
            startLine
            firstComment: comments(first: 1) {
              nodes {
                databaseId
                body
                diffHunk
                originalLine
                outdated
                author { login }
              }
            }
            latestComment: comments(last: 1) {
              nodes {
                databaseId
                body
                author { login }
              }
            }
          }
        }
      }
    }
  }'
```

Loop while `pageInfo.hasNextPage=true`, passing the previous `endCursor` as `after`, so PRs with more than 100 review threads are fully scanned. Keep only threads where `isResolved=false`. Use `firstComment.nodes[0]` for the reply anchor and diff hunk, and `latestComment.nodes[0]` for loop-guard checks. Also fetch issue-level (general PR) comments via `gh api --hostname <github-host> repos/<owner>/<repo>/issues/<number>/comments` — these are not resolvable on GitHub; treat them as informational and only reply if substantive.

#### GitLab (REST discussions)

```bash
glab api --hostname <gitlab-host> \
  projects/<urlencoded-path>/merge_requests/<iid>/discussions \
  --paginate
```

Keep only discussions where `resolved=false` and `resolvable=true`. Each discussion's `notes[0]` is the original comment; later notes are existing replies. A discussion is inline when `notes[0].position` is present (with `new_path`/`new_line`); without `position` it's a general comment.

#### Filter out our own follow-ups

Skip any thread whose most recent note/comment was posted by /resolve-mr (detected via the attribution footer `_— Addressed via /resolve-mr` in the latest comment body). Otherwise the skill will loop on disputes or pending clarification asks.

If the total unresolved thread count exceeds ~30, tell the user the count and ask whether to address all of them, only `[blocking]`/`[important]` ones, or a specific file.

### 4. Evaluate each comment

For every unresolved thread, read the file at the referenced path and lines (use the current code — the diff hunk is just an anchor). Then put it in exactly one bucket:

1. **apply** — the comment is concrete, correct, and points at code you can fix. Plan the smallest change that addresses it without touching unrelated code.
2. **already-addressed** — the code at that location already does what the comment asks (e.g. fixed in a later commit, the line is gone, or the concern doesn't apply to the current state).
3. **disagree** — the comment is wrong, based on a misreading, or its premise no longer holds. You must be able to state *why* in one or two sentences with a code reference.
4. **clarify** — the comment is ambiguous; you cannot tell what the author wants without more information.
5. **defer** — valid but out of scope for this MR/PR (would expand the diff unreasonably, or touches code untouched by this branch).

Rules of thumb:

- Effort is not a tiebreaker. If a fix is correct and in scope, apply it even if it's tedious.
- Praise / pure questions / "thanks!" — bucket as **already-addressed**, reply briefly, and resolve.
- Comments on lines that are no longer in the file → almost always **already-addressed**.
- Subjective style preferences without a concrete failure case → usually **disagree** with a one-line reason, or **apply** if it genuinely improves readability and the cost is trivial.
- Security / correctness / data-loss concerns: when in doubt, apply. Never **disagree** with a security comment unless you can demonstrate the threat model is wrong.

You may process independent comments (different files, no shared state) in parallel via sub-agents to speed up large batches.

### 5. Apply fixes

- Edit code with the project's normal tools. Group edits by file to minimize re-reads.
- Stay inside the scope of each comment — do not refactor surrounding code, rename unrelated symbols, or "while I'm here" cleanup.
- If two comments conflict, follow the higher-severity one (correctness > style) and explain in the lower-severity reply.
- Do not run the project's tests, typecheck, or lint as part of this workflow unless the user asks. Replies should not claim "tests pass" when you didn't run them.

### 6. Commit

- Stage only the files you touched (`git add <paths>`, not `git add -A`).
- One commit covering all applied fixes. Message:

  ```
  fix: address review comments on <PR|MR> #<number>
  ```

  If your repo uses a different commit convention, match it (check `git log --oneline -20`).
- Do not amend prior commits. Do not commit if no fixes were applied — skip straight to replies.
- Never use `--no-verify`. If a pre-commit hook fails, fix the underlying issue and create a new commit.

### 7. Reply and resolve each thread

Post one reply per thread. Body shape:

- One or two sentences stating the outcome.
- For **apply**: name the commit short SHA and the file:line(s) touched.
- For **already-addressed**: point at the line or commit that addresses it.
- For **disagree**: state the reason concretely.
- For **clarify**: ask the specific question.
- For **defer**: note why it's out of scope and suggest a follow-up (issue, ticket, or "next MR").
- End with the attribution footer on its own line, separated by a blank line:

  ```
  _— Addressed via /resolve-mr ({model})_
  ```

  Replace `{model}` with the active model name (e.g. `Claude Opus 4.7`).

**Then mark the thread resolved only for `apply` and `already-addressed` outcomes.** Leave `disagree`, `clarify`, and `defer` open so the human author can respond.

#### GitHub

Reply to the original comment of the thread (use `databaseId` of the first comment in the thread):

```bash
gh api --hostname <github-host> \
  -X POST repos/<owner>/<repo>/pulls/<number>/comments/<databaseId>/replies \
  -f body="$REPLY_BODY"
```

Resolve the thread (use the GraphQL thread `id`, not `databaseId`):

```bash
gh api graphql --hostname <github-host> \
  -F threadId=<thread-id> \
  -f query='mutation($threadId: ID!) {
    resolveReviewThread(input: {threadId: $threadId}) {
      thread { id isResolved }
    }
  }'
```

For issue-level comments (no thread id), reply with `gh api --hostname <github-host> repos/<owner>/<repo>/issues/<number>/comments -X POST -f body="..."`. There is no resolve action for these on GitHub; do not attempt one.

#### GitLab

Reply to a discussion:

```bash
glab api --hostname <gitlab-host> \
  -X POST projects/<urlencoded-path>/merge_requests/<iid>/discussions/<discussion-id>/notes \
  --field body="$REPLY_BODY"
```

Resolve a discussion:

```bash
glab mr note resolve <iid> <discussion-id> --repo <full-project-url>
```

(Equivalent to `glab api ... discussions/<id> -X PUT --field resolved=true` if the `glab mr note resolve` command is unavailable.)

If a per-thread reply or resolve call fails, continue with the remaining threads and include the failure in the final report — do not abort the whole run.

### 8. Push

- If the current branch already has an upstream (`git rev-parse --abbrev-ref --symbolic-full-name @{u}` succeeds), run `git push` after the commit — replies referencing the commit SHA will then point at a real artifact on the platform.
- If the branch has no upstream, stop and ask the user before running `git push -u <remote> <branch>`. Do not pick a remote yourself.
- Never force-push. Never push to a protected branch.

### 9. Report

Print:
- Counts by outcome: applied / already-addressed / disagreed / clarified / deferred / skipped.
- The commit SHA (if any) and whether it was pushed.
- Any threads where reply or resolve failed, with the URL and error.
- A reminder that the user should review the replies and the diff before relying on the result.

## Guardrails

- Never resolve a thread you disagreed with, asked for clarification on, or deferred. Resolution is only for fixes that have actually landed.
- Never approve the MR/PR — approval is a human judgement call (mirrors `/review-mr`).
- Do not edit the MR/PR body, change labels, assignees, milestone, reviewers, or merge state.
- Do not check out, create, delete, or rebase branches.
- Do not amend or rewrite existing commits. Always make a new commit.
- Never use `--no-verify` to bypass commit hooks.
- Never force-push. Never push to `main`/`master` or other protected branches even with an upstream set.
- Do not install or authenticate CLIs on the user's behalf.
- Do not run the project's tests, build, lint, or typecheck unless the user explicitly asks.
- Do not invent file paths or line numbers — every reply must point at code that exists at the SHA you committed.
- Match the host's vocabulary: GitHub → "pull request", GitLab → "merge request". The user saying "MR" on a GitHub repo is fine; explain the mapping briefly.
