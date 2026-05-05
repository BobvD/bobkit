---
name: review-mr
description: Review a merge request or pull request from a GitHub/GitLab URL and post inline comments with concrete suggestions. Use when the user asks to review an MR/PR, invokes /review-mr, or shares a PR/MR link asking for feedback.
targets: ["*"]
codexcli:
  short-description: Review a GitLab MR or GitHub PR with inline comments
copilot:
  license: MIT
---

# Review MR

Review a merge request or pull request and post inline, line-level comments with concrete improvement suggestions. Detect the host from the URL, fetch the diff with the native CLI, draft the review locally, show it to the user, and only submit after explicit approval.

## Workflow

### 1. Parse the URL and detect host

The user must provide an MR or PR URL as argument. If they did not, ask for one — do not guess from the current branch.

- GitHub: `https://github.com/<owner>/<repo>/pull/<number>` → set host=github, capture owner, repo, number.
- GitLab: `https://<host>/<group>(/<subgroup>)*/<repo>/-/merge_requests/<iid>` → set host=gitlab, capture the full project path and the IID.
- If the URL does not match either pattern, stop and ask the user to confirm the host.

### 2. Verify the CLI

- GitHub → require `gh`. GitLab → require `glab`.
- Check installation with `command -v gh` / `command -v glab`. If missing, stop and suggest `brew install gh` or `brew install glab`. Do not install on the user's behalf.
- Check auth with `gh auth status` / `glab auth status`. If unauthenticated, stop and ask the user to run `gh auth login` / `glab auth login`.

### 3. Fetch MR/PR context

Pull only what you need to review:

- **GitHub:**
  - Metadata: `gh pr view <number> --repo <owner>/<repo> --json title,body,baseRefName,headRefName,headRefOid,author,additions,deletions,files`
  - Diff: `gh pr diff <number> --repo <owner>/<repo>`
- **GitLab:**
  - Metadata: `glab mr view <iid> --repo <project-path>` (or `glab api projects/<urlencoded>/merge_requests/<iid>`)
  - Diff: `glab mr diff <iid> --repo <project-path>`
  - Diff refs (needed for inline positioning): `glab api projects/<urlencoded>/merge_requests/<iid>/versions` → keep `base_commit_sha`, `start_commit_sha`, `head_commit_sha` from element `[0]`.

If the diff is large (over ~1500 changed lines), tell the user and ask whether to focus on specific files.

### 4. Review the diff

Review **only lines introduced by this MR/PR** (the `+` side of the diff). Do not flag pre-existing code unless the change directly worsens it.

**Categories, in priority order:**

1. **Correctness / bugs** — logic errors, off-by-one, null/undefined, race conditions, error handling, missed branches.
2. **Security** — injection, auth/authz gaps, secret leakage, unsafe deserialization, crypto misuse, SSRF, IDOR.
3. **Tests** — missing coverage of new branches and edge cases; assertions that don't actually assert behavior.
4. **Performance** — N+1 queries, accidental quadratic loops, unbounded allocations, missing pagination, async misuse.
5. **API / maintainability** — public surface design, single responsibility, over-engineering, accidental coupling, breaking changes.
6. **Readability** — unclear names, dead code, stale comments, TODOs without owner.

**Do not flag:**

- Style/formatting/lint issues — assume linters cover those.
- Generic "you should validate inputs" without a specific exploit or failure case.
- Speculative concerns ("this *might* break if..."). If you cannot explain *why* and *when* it breaks, skip it.
- Pre-existing issues outside the diff.
- Praise unless it is genuinely instructive (call out a notably good pattern, not "nice work").
- Repeating issues a CI tool will catch.

**Confidence bar:** if you would not stake your reputation on it, do not post it. Returning zero findings is acceptable.

### 5. Format each finding

Each finding is one inline comment, anchored to a specific file and line range, with:

1. A severity tag at the start of the body, from this fixed vocabulary:
   - `[blocking]` — must be fixed before merge (correctness, security, broken contract).
   - `[important]` — should be fixed but not strictly blocking.
   - `[nit]` — small improvement, author's discretion.
   - `[suggestion]` — alternative worth considering.
2. One or two sentences explaining the issue and the failure scenario.
3. When proposing concrete code, include a suggestion block the platform can apply with one click:
   - **GitHub:** ```` ```suggestion ```` ... ```` ``` ````
   - **GitLab:** ```` ```suggestion:-0+0 ```` ... ```` ``` ```` (the `-0+0` line range is required)

Do not put file paths or line numbers in the body — the API attaches them. One issue per comment.

### 6. Draft the review locally and show the user

Build the review payload as a JSON file in a temp location. Then print a concise summary to the user:

- Total findings, broken down by severity.
- One-line preview of each finding (`path:line — [severity] short text`).
- Proposed review event: `COMMENT` by default; `REQUEST_CHANGES` only if at least one `[blocking]` finding exists; `APPROVE` only if zero findings *and* the user explicitly asked for an approval.

Ask the user to approve, edit, or cancel before any network call posts comments.

### 7. Submit the review

Only after explicit approval.

#### GitHub (pending-review pattern)

`gh pr review` cannot post multiple inline comments, so use the REST API:

```bash
gh api -X POST repos/<owner>/<repo>/pulls/<number>/reviews \
  --input review.json
```

`review.json` shape:

```json
{
  "commit_id": "<headRefOid>",
  "event": "COMMENT",
  "body": "Automated review via /review-mr.",
  "comments": [
    {
      "path": "src/auth.ts",
      "line": 67,
      "side": "RIGHT",
      "body": "[blocking] Missing await — promise resolves after the response is sent.\n\n```suggestion\n  await authorize(user);\n```"
    },
    {
      "path": "src/auth.ts",
      "start_line": 88,
      "start_side": "RIGHT",
      "line": 95,
      "side": "RIGHT",
      "body": "[important] State is not cleaned up on the error path."
    }
  ]
}
```

For multi-line comments, set `start_line` + `start_side` plus `line` + `side`. `side` is `RIGHT` for added lines, `LEFT` for unchanged/removed.

#### GitLab (discussions API)

`glab mr note` is single-line and untargeted; use the discussions endpoint with a position object:

```bash
glab api projects/<urlencoded-path>/merge_requests/<iid>/discussions \
  --method POST --header "Content-Type: application/json" \
  --input discussion.json
```

`discussion.json` shape (one call per finding):

```json
{
  "body": "[blocking] Null pointer on empty input.\n\n```suggestion:-0+0\n  if (!items?.length) return;\n```",
  "position": {
    "position_type": "text",
    "base_sha": "<base_commit_sha>",
    "start_sha": "<start_commit_sha>",
    "head_sha": "<head_commit_sha>",
    "old_path": "src/auth.ts",
    "new_path": "src/auth.ts",
    "new_line": 67
  }
}
```

For unchanged-side comments, set `old_line` instead of `new_line`. After the per-finding calls, post a summary note via `glab mr note <iid> -m "..."` with totals and severity breakdown.

### 8. Report back

Print:
- The review URL on the platform.
- Counts by severity.
- Anything that failed to post and why.

## Guardrails

- Never submit the review without explicit user approval of the draft.
- Never post `REQUEST_CHANGES` unless at least one `[blocking]` finding is present.
- Never `APPROVE` automatically — approval is a human judgement call.
- Do not edit the MR/PR body, change labels, assignees, or merge state.
- Do not check out, push to, or modify the source branch.
- Do not run the project's tests or build as part of review unless the user asks.
- Do not install or authenticate CLIs on the user's behalf.
- Do not invent file paths or line numbers — every comment must point to a real `+` or context line in the fetched diff.
- Match the host's vocabulary: GitHub → "pull request", GitLab → "merge request". The user saying "MR" on a GitHub repo is fine; explain the mapping briefly.
