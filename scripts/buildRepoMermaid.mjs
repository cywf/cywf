#!/usr/bin/env node

/**
 * Build Repository Mermaid Diagram
 * Generates a deterministic mindmap for the tracked public repositories.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const README_PATH = join(process.cwd(), 'README.md');
const PROJECTS_PATH = join(process.cwd(), 'config', 'projects.json');

function sanitize(text) {
  if (!text) return 'No description';
  return text.replace(/["\[\](){}]/g, '').replace(/\n/g, ' ').trim();
}

async function loadProjects() {
  return JSON.parse(await readFile(PROJECTS_PATH, 'utf8'));
}

function generateMermaid(projects) {
  const lines = ['mindmap', '  root((cywf repos))'];
  for (const project of projects) {
    lines.push(`    ${project.repo}[${sanitize(project.desc)}]`);
  }
  return lines.join('\n');
}

async function updateReadme(mermaidCode) {
  const readme = await readFile(README_PATH, 'utf8');
  const startMarker = '<!-- START: REPO_MERMAID -->';
  const endMarker = '<!-- END: REPO_MERMAID -->';
  const startIndex = readme.indexOf(startMarker);
  const endIndex = readme.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    console.log('Skipping Mermaid update because README markers are missing.');
    process.exit(0);
  }

  const replacement = [
    startMarker,
    '<details>',
    '<summary><b>🧭 Repository Map (Mermaid)</b></summary>',
    '',
    '```mermaid',
    mermaidCode,
    '```',
    '</details>',
    endMarker,
  ].join('\n');

  const updated = `${readme.slice(0, startIndex)}${replacement}${readme.slice(endIndex + endMarker.length)}`;
  await writeFile(README_PATH, updated, 'utf8');
}

async function main() {
  const projects = await loadProjects();
  await updateReadme(generateMermaid(projects));
  console.log(`✓ Repository map updated for ${projects.length} repositories`);
}

main().catch((error) => {
  console.error('Error updating Mermaid diagram:', error.message);
  process.exit(1);
});
