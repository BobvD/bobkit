import { readFileSync } from 'node:fs';
import path from 'node:path';

export function changelogEntry(root, version) {
  const changelogPath = path.join(root, 'CHANGELOG.md');
  const changelog = readFileSync(changelogPath, 'utf8');
  const lines = changelog.split(/\r?\n/);
  const headingPattern = new RegExp(`^##\\s+\\[?${escapeRegExp(version)}\\]?(?:\\s+-\\s+.+)?\\s*$`);
  const start = lines.findIndex((line) => headingPattern.test(line));

  if (start === -1) {
    return null;
  }

  const next = lines.findIndex((line, index) => index > start && /^##\s+/.test(line));
  const body = lines.slice(start + 1, next === -1 ? lines.length : next).join('\n').trim();

  return {
    heading: lines[start],
    body,
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
