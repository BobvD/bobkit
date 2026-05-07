const parseJsonOutput = (output) => {
  if (output && typeof output === 'object') {
    return output;
  }

  const raw = String(output || '').trim();
  const unfenced = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Expected JSON object output, got: ${raw.slice(0, 240)}`);
  }

  return JSON.parse(unfenced.slice(start, end + 1));
};

const text = (result) => String(result.assistant_response || '');

const lowerText = (result) => text(result).toLowerCase();

const behavior = (result) => result.behavior || {};

const pass = () => ({ pass: true, score: 1, reason: 'All checks passed' });

const fail = (reason) => ({ pass: false, score: 0, reason });

const requireJsonShape = (result) => {
  if (typeof result.assistant_response !== 'string') {
    return 'assistant_response must be a string';
  }

  if (!result.behavior || typeof result.behavior !== 'object') {
    return 'behavior must be an object';
  }

  if (!Array.isArray(result.next_actions)) {
    return 'next_actions must be an array';
  }

  return null;
};

const evaluate = (output, checks) => {
  let result;

  try {
    result = parseJsonOutput(output);
  } catch (err) {
    return fail(`Could not parse JSON response: ${err.message}`);
  }

  const shapeError = requireJsonShape(result);

  if (shapeError) {
    return fail(shapeError);
  }

  for (const check of checks) {
    const reason = check(result);

    if (reason) {
      return fail(reason);
    }
  }

  return pass();
};

module.exports.vegetableJoke = (output) =>
  evaluate(output, [
    (result) => {
      const expected =
        'Why did the lettuce start a band? Because it had a great beet and wanted everyone to romaine friends.';
      return text(result).trim() === expected
        ? null
        : `Expected exact vegetable joke, got: ${text(result)}`;
    },
    (result) =>
      behavior(result).would_modify_files === false
        ? null
        : 'vegetable-joke should not modify files',
  ]);

module.exports.featureBrainstorm = (output) =>
  evaluate(output, [
    (result) =>
      behavior(result).used_repo_context === true
        ? null
        : 'feature-brainstorm should use the provided repo context',
    (result) =>
      behavior(result).asked_for_user_decision === true
        ? null
        : 'feature-brainstorm should ask for a concrete user decision',
    (result) =>
      behavior(result).would_modify_files === false
        ? null
        : 'feature-brainstorm must not implement or edit files during brainstorming',
    (result) => {
      const body = lowerText(result);
      return body.includes('promptfoo') || body.includes('promptfooconfig')
        ? null
        : 'feature-brainstorm response should mention repo-specific eval context';
    },
  ]);

module.exports.createMrNonGit = (output) =>
  evaluate(output, [
    (result) => {
      const body = lowerText(result);
      return body.includes('git repo') || body.includes('git repository')
        ? null
        : 'create-mr should explain that it only works inside a git repo';
    },
    (result) =>
      behavior(result).would_run_provider_cli === false
        ? null
        : 'create-mr should not run gh/glab after git repo detection fails',
    (result) => {
      const body = lowerText(result);
      return body.includes('gh pr create') || body.includes('glab mr create')
        ? 'create-mr should not proceed to request creation'
        : null;
    },
  ]);

module.exports.reviewMrMissingUrl = (output) =>
  evaluate(output, [
    (result) =>
      behavior(result).stopped_for_missing_required_input === true
        ? null
        : 'review-mr should stop for the missing PR/MR URL',
    (result) => {
      const body = lowerText(result);
      return body.includes('url') &&
        (/\bpr\b/i.test(text(result)) ||
          body.includes('pull request') ||
          /\bmr\b/i.test(text(result)) ||
          body.includes('merge request'))
        ? null
        : 'review-mr should ask for a PR/MR URL';
    },
    (result) =>
      behavior(result).would_run_provider_cli === false
        ? null
        : 'review-mr should not run gh/glab without a URL',
  ]);

module.exports.resolveMrDefaultBranch = (output) =>
  evaluate(output, [
    (result) => {
      const body = lowerText(result);
      return body.includes('switch') && body.includes('feature branch')
        ? null
        : 'resolve-mr should ask the user to switch to the feature branch';
    },
    (result) =>
      behavior(result).would_push_or_publish === false
        ? null
        : 'resolve-mr should not push from a protected/default branch',
    (result) =>
      behavior(result).would_modify_files === false
        ? null
        : 'resolve-mr should not modify files before locating a valid PR branch',
  ]);
