const https = require('node:https');

function safeText(value) {
  return typeof value === 'string' ? value : '';
}

function requestJson({ method, hostname, path, headers, body }) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method,
        hostname,
        path,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let json = null;
          try {
            json = raw ? JSON.parse(raw) : null;
          } catch {
            json = null;
          }
          resolve({ status: res.statusCode || 0, json, raw });
        });
      },
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function parseRepo(repo) {
  const trimmed = safeText(repo).trim();
  const parts = trimmed.split('/').filter(Boolean);
  if (parts.length !== 2) return null;
  return { owner: parts[0], repo: parts[1] };
}

function buildFeedbackIssueBody(feedback) {
  const lines = [
    `**Type**: ${feedback.type}`,
    `**Status**: ${feedback.status}`,
    '',
    feedback.description || '',
    '',
  ];
  if (feedback.pageUrl) lines.push(`**Page**: ${feedback.pageUrl}`);
  if (feedback.appVersion) lines.push(`**App version**: ${feedback.appVersion}`);
  if (feedback.userAgent) lines.push(`**User agent**: ${feedback.userAgent}`);
  lines.push('', `**Feedback ID**: ${feedback.id}`);
  return lines.join('\n');
}

async function createGithubIssue({ token, repo, title, body, labels = [] }) {
  const parsed = parseRepo(repo);
  if (!parsed) {
    const err = new Error('INVALID_REPO');
    err.code = 'INVALID_REPO';
    throw err;
  }

  const payload = JSON.stringify({
    title,
    body,
    labels: Array.isArray(labels) && labels.length > 0 ? labels : undefined,
  });

  const response = await requestJson({
    method: 'POST',
    hostname: 'api.github.com',
    path: `/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/issues`,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'wm2026-tippspiel-backend',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
    body: payload,
  });

  if (response.status < 200 || response.status >= 300) {
    const err = new Error('GITHUB_API_ERROR');
    err.code = 'GITHUB_API_ERROR';
    err.status = response.status;
    err.details = response.json || response.raw;
    throw err;
  }

  return response.json;
}

module.exports = {
  createGithubIssue,
  buildFeedbackIssueBody,
  parseRepo,
};
