const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');

const readSkill = (skillName) => {
  if (!/^[a-z0-9-]+$/.test(skillName)) {
    throw new Error(`Invalid skill name: ${skillName}`);
  }

  const skillPath = path.join(root, '.rulesync', 'skills', skillName, 'SKILL.md');
  return fs.readFileSync(skillPath, 'utf8');
};

module.exports = async ({ vars }) => {
  const skillName = vars.skill_name;
  const skillBody = readSkill(skillName);
  const scenario = vars.scenario || 'No additional simulated environment facts.';

  return `You are running a Bobkit skill behavior eval.

Follow the skill under test exactly, but do not actually run shell commands, edit files, call provider CLIs, push branches, or contact GitHub/GitLab. Treat the simulated environment facts as command results that have already been observed. If the skill would need information that is not present, ask for that information instead of inventing it.

<skill_under_test name="${skillName}">
${skillBody}
</skill_under_test>

<simulated_environment>
${scenario}
</simulated_environment>

<user_request>
${vars.request}
</user_request>

Return only valid JSON with this shape:
{
  "assistant_response": "The exact message you would send to the user.",
  "behavior": {
    "used_repo_context": false,
    "offered_multiple_approaches": false,
    "asked_for_user_decision": false,
    "would_modify_files": false,
    "would_run_provider_cli": false,
    "would_push_or_publish": false,
    "stopped_for_missing_required_input": false
  },
  "next_actions": []
}`;
};
