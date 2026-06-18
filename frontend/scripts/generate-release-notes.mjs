import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');
const outDir = join(__dirname, '..', 'src', 'data');
const outFile = join(outDir, 'releaseNotes.json');
const GITHUB_REPO = 'https://github.com/schmeckm/WM2026_Prediction';
const LIMIT = 20;

function parseSubject(subject) {
  const match = subject.match(/^(\w+)(?:\([^)]+\))?!?:\s*(.+)$/);
  if (!match) {
    return { type: 'other', title: subject, core: false };
  }

  const [, type, rest] = match;
  const normalizedType = type === 'feat' ? 'feature' : type;
  return {
    type: normalizedType,
    title: rest.charAt(0).toUpperCase() + rest.slice(1),
    core: type === 'feat',
  };
}

function generate() {
  let raw;
  try {
    const result = spawnSync(
      'git',
      ['log', `-${LIMIT}`, '--pretty=format:%H|%h|%s|%cI'],
      { cwd: repoRoot, encoding: 'utf8' },
    );
    if (result.status !== 0) {
      throw new Error(result.stderr || 'git log failed');
    }
    raw = result.stdout.trim();
  } catch (error) {
    console.warn('generate-release-notes: git log failed, skipping update.');
    console.warn(error.message);
    return;
  }

  if (!raw) {
    console.warn('generate-release-notes: no commits found.');
    return;
  }

  const entries = raw.split('\n').map((line) => {
    const [sha, shortSha, subject, date] = line.split('|');
    const parsed = parseSubject(subject);
    return {
      sha,
      shortSha,
      date,
      subject,
      ...parsed,
      url: `${GITHUB_REPO}/commit/${sha}`,
    };
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    repository: GITHUB_REPO,
    limit: LIMIT,
    entries,
  };

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${outFile} (${entries.length} entries)`);
}

generate();
