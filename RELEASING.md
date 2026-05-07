# Releasing Bobkit

Bobkit is published to npm as `bobkit`. npm Trusted Publishing is configured for `BobvD/bobkit` through `.github/workflows/npm-publish.yml`.

## Release Flow

1. Bump the version in `package.json` and `package-lock.json`.

   ```bash
   npm version patch --no-git-tag-version
   ```

2. Add a matching `CHANGELOG.md` entry.

   ```markdown
   ## 0.1.1 - Short release name
   ```

3. Verify the release metadata.

   ```bash
   npm run release:check
   ```

4. Run the normal validation for the change.

   ```bash
   npm run rulesync:check
   npm run build:package
   npm run build:claude
   npm run eval
   ```

5. Open and merge the pull request to `main`.

6. The `npm Publish` workflow sees the unreleased version, runs CI, verifies the package tarball, publishes to npm through Trusted Publishing, creates `v<version>`, and creates a GitHub release from the changelog entry.

## Useful Checks

```bash
npm view bobkit version dist-tags.latest bin
gh release view v$(node -p "require('./package.json').version")
gh run list --workflow "npm Publish" --branch main --limit 5
```

If the version in `package.json` is already published, the workflow validates and skips publishing. GitHub README changes appear as soon as they merge to `main`; the npm package README updates on the next package publish.

## Package Contents

`npm run build:package` regenerates target skills and checks that required package files exist before npm packing. The published tarball should include:

```text
.codex/skills/
.claude/skills/
README.md
CONTRIBUTING.md
RELEASING.md
CHANGELOG.md
bin/
package.json
```
