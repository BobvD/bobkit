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

Review a merge request or pull request and post inline, line-level comments with concrete improvement suggestions. Detect the host from the URL, fetch the diff with the native CLI, draft the review locally, submit it immediately, and report the result after submission.

## Workflow

### 1. Parse the URL and detect host

The user must provide an MR or PR URL as argument. If they did not, ask for one — do not guess from the current branch.

- GitHub: `https://<github-host>/<owner>/<repo>/pull/<number>` → set host=github, capture the GitHub hostname (`github.com` or a GitHub Enterprise host), owner, repo, and number. Build `repo_arg` as `<owner>/<repo>` for `github.com`, or `<github-host>/<owner>/<repo>` for Enterprise.
- GitLab: `https://<gitlab-host>/<group>(/<subgroup>)*/<repo>/-/merge_requests/<iid>` → set host=gitlab, capture the GitLab hostname, full project path, IID, and full project URL.
- If the URL does not match either pattern, stop and ask the user to confirm the host.

### 2. Verify the CLI

- GitHub → require `gh`. GitLab → require `glab`.
- Check installation with `command -v gh` / `command -v glab`. If missing, stop and ask the user to install it. Suggest `brew install gh` or `brew install glab` on macOS, and mention the official package manager docs for other systems. Do not install on the user's behalf.
- Check auth with `gh auth status --hostname <github-host>` / `glab auth status --hostname <gitlab-host>`. If unauthenticated, stop and ask the user to run `gh auth login` / `glab auth login` for that hostname.

### 3. Fetch MR/PR context

Pull only what you need to review:

- **GitHub:**
  - Metadata: `gh pr view <number> --repo <repo_arg> --json title,body,baseRefName,headRefName,headRefOid,author,additions,deletions,files`
  - Diff: `gh pr diff <number> --repo <repo_arg>`
- **GitLab:**
  - Metadata: `glab mr view <iid> --repo <full-project-url>` (or `glab api --hostname <gitlab-host> projects/<urlencoded>/merge_requests/<iid>`)
  - Diff: `glab mr diff <iid> --repo <full-project-url>`
  - Diff refs (needed for inline positioning): `glab api --hostname <gitlab-host> projects/<urlencoded>/merge_requests/<iid>/versions` → keep `base_commit_sha`, `start_commit_sha`, `head_commit_sha` from the first element (the most recent version).

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

1. A severity tag at the start of the body, prefixed with its priority emoji, from this fixed vocabulary (most urgent first):
   - 🚨 `[blocking]` — must be fixed before merge (correctness, security, broken contract).
   - ⚠️ `[important]` — should be fixed but not strictly blocking.
   - 💡 `[suggestion]` — alternative worth considering.
   - 📝 `[nit]` — small improvement, author's discretion.
2. One or two sentences explaining the issue and the failure scenario.
3. When proposing concrete code, include a suggestion block the platform can apply with one click:
   - **GitHub:** ```` ```suggestion ```` ... ```` ``` ````
   - **GitLab:** ```` ```suggestion:-0+0 ```` ... ```` ``` ```` (the `-0+0` line range is required)
4. End the body with an attribution footer on its own line so the comment is not mistaken for a human review (the platform posts under the user's account):

   ```
   _— AI code review via /review-mr ({model})_
   ```

   Replace `{model}` with the active model name (e.g. `Claude Opus 4.7`). Separate the footer from the body with a blank line.

Do not put file paths or line numbers in the body — the API attaches them. One issue per comment.

### 6. Build the review payload

Build the host-specific review payload file(s) in a temp location: GitHub uses one review JSON file, while GitLab uses one discussion JSON file per finding plus a summary note. Pick the platform action:

- Post comments by default.
- GitHub: use `REQUEST_CHANGES` only if at least one `[blocking]` finding exists.
- Approve only if zero findings *and* the user explicitly asked for an approval: GitHub uses `APPROVE`, GitLab uses `glab mr approve`.

### 7. Submit the review

#### GitHub (pending-review pattern)

`gh pr review` cannot post multiple inline comments, so use the REST API:

```bash
gh api --hostname <github-host> -X POST repos/<owner>/<repo>/pulls/<number>/reviews \
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
      "body": "🚨 [blocking] Missing await — promise resolves after the response is sent.\n\n```suggestion\n  await authorize(user);\n```\n\n_— AI code review via /review-mr (Claude Opus 4.7)_"
    },
    {
      "path": "src/auth.ts",
      "start_line": 88,
      "start_side": "RIGHT",
      "line": 95,
      "side": "RIGHT",
      "body": "⚠️ [important] State is not cleaned up on the error path.\n\n_— AI code review via /review-mr (Claude Opus 4.7)_"
    }
  ]
}
```

For multi-line comments, set `start_line` + `start_side` plus `line` + `side`. `side` is `RIGHT` for added lines and unchanged context lines, `LEFT` for deletions only.

#### GitLab (discussions API)

`glab mr note` is single-line and untargeted; use the discussions endpoint with a position object:

```bash
glab api --hostname <gitlab-host> projects/<urlencoded-path>/merge_requests/<iid>/discussions \
  --method POST --header "Content-Type: application/json" \
  --input discussion.json
```

`discussion.json` shape (one call per finding):

```json
{
  "body": "🚨 [blocking] Null pointer on empty input.\n\n```suggestion:-0+0\n  if (!items?.length) return;\n```\n\n_— AI code review via /review-mr (Claude Opus 4.7)_",
  "position": {
    "position_type": "text",
    "base_sha": "<base_commit_sha>",
    "start_sha": "<start_commit_sha>",
    "head_sha": "<head_commit_sha>",
    "old_path": "src/old-auth.ts",
    "new_path": "src/auth.ts",
    "new_line": 67
  }
}
```

For non-renamed files, `old_path` and `new_path` are the same. For renames, `old_path` must be the pre-rename path and `new_path` must be the current path.

For deletion comments, set `old_line` instead of `new_line`. Context lines can use either; `new_line` is the safer default. Continue posting remaining discussion payloads if one per-finding call fails, and include failed path/line/error details in the report. After the per-finding calls, post a summary note via `glab mr note <iid> --repo <full-project-url> -m "..."` with totals and severity breakdown.

If there are zero findings and the user explicitly asked for approval, approve instead of posting discussions:

```bash
glab mr approve <iid> --repo <full-project-url> --sha <head_commit_sha>
```

### 8. Report back

Print:
- The review URL on the platform.
- Counts by severity.
- Anything that failed to post and why.

## Guardrails

- Never post `REQUEST_CHANGES` unless at least one `[blocking]` finding is present.
- Never `APPROVE` automatically — approval is a human judgement call.
- Do not edit the MR/PR body, change labels, assignees, or merge state.
- Do not check out, push to, or modify the source branch.
- Do not run the project's tests or build as part of review unless the user asks.
- Do not install or authenticate CLIs on the user's behalf.
- Do not invent file paths or line numbers — every comment must point to a real `+` or context line in the fetched diff.
- Match the host's vocabulary: GitHub → "pull request", GitLab → "merge request". The user saying "MR" on a GitHub repo is fine; explain the mapping briefly.
