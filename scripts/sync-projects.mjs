#!/usr/bin/env node
/**
 * Refresh data/projects.json from the public GitHub API.
 *
 * The site itself also tries a live browser fetch and falls back to this file.
 * Running this on a schedule keeps the offline snapshot close to reality and
 * avoids depending on a visitor's unauthenticated GitHub rate limit.
 */

import { readFile, writeFile } from 'node:fs/promises';

const username = process.env.GITHUB_REPOSITORY_OWNER || 'flairamos';
const token = process.env.GITHUB_TOKEN || '';
const apiUrl = `https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`;

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': `${username}-portfolio-sync`
};
if (token) headers.Authorization = `Bearer ${token}`;

const response = await fetch(apiUrl, { headers });
if (!response.ok) {
  throw new Error(`GitHub API responded with ${response.status} ${response.statusText}`);
}

const repos = await response.json();
if (!Array.isArray(repos)) throw new Error('Unexpected GitHub API payload');

const projects = repos
  .filter((repo) => repo && !repo.fork && repo.name !== username)
  .map((repo) => ({
    name: repo.name,
    description: repo.description || '',
    html_url: repo.html_url,
    homepage: repo.homepage || null,
    language: repo.language || null,
    stargazers_count: repo.stargazers_count || 0,
    forks_count: repo.forks_count || 0,
    pushed_at: repo.pushed_at,
    topics: repo.topics || [],
    license: repo.license
      ? { spdx_id: repo.license.spdx_id, name: repo.license.name }
      : null,
    fork: false
  }));

const payload = {
  generatedAt: new Date().toISOString(),
  source: apiUrl,
  projects
};

const outputUrl = new URL('../data/projects.json', import.meta.url);
let previous = null;
try {
  previous = JSON.parse(await readFile(outputUrl, 'utf8'));
} catch {
  /* No usable snapshot yet. */
}

if (previous && JSON.stringify(previous.projects) === JSON.stringify(projects)) {
  console.log(`No project changes for ${username}; snapshot left untouched.`);
  process.exit(0);
}

await writeFile(outputUrl, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

console.log(`Synced ${projects.length} public repositories for ${username}.`);
