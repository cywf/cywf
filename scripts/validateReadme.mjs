#!/usr/bin/env node

/**
 * Validate README structure
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const README_PATH = join(process.cwd(), 'README.md');

const REQUIRED_MARKERS = [
  'START: DAILY_BRIEF',
  'END: DAILY_BRIEF',
  'START: LATEST_POSTS',
  'END: LATEST_POSTS',
  'START: PROJECT_MATRIX',
  'END: PROJECT_MATRIX',
  'START: REPO_MERMAID',
  'END: REPO_MERMAID',
  'START: LEARNING_DYNAMIC',
  'END: LEARNING_DYNAMIC',
  'START: GH_SHOWCASE',
  'END: GH_SHOWCASE',
];

async function validateReadme() {
  console.log('Validating README.md structure...\n');
  
  const content = await readFile(README_PATH, 'utf8');
  
  let allOk = true;
  
  // Check for required markers
  console.log('Checking for required markers:');
  for (const marker of REQUIRED_MARKERS) {
    const found = content.includes(`<!-- ${marker} -->`);
    console.log(`  ${found ? '✓' : '✗'} ${marker}`);
    if (!found) allOk = false;
  }
  
  // Check for balanced details tags
  console.log('\nChecking HTML structure:');
  const openTags = (content.match(/<details>/g) || []).length;
  const closeTags = (content.match(/<\/details>/g) || []).length;
  console.log(`  ${openTags === closeTags ? '✓' : '✗'} Details tags balanced: ${openTags} open, ${closeTags} close`);
  if (openTags !== closeTags) allOk = false;
  
  // Check for escaped HTML
  const hasEscaped = content.includes('&lt;') || content.includes('&gt;');
  console.log(`  ${!hasEscaped ? '✓' : '✗'} No escaped HTML tags`);
  if (hasEscaped) allOk = false;
  
  // Check for markdown code fence wrapping details (should not exist)
  // This checks if there's a ```markdown fence containing <details>
  const hasMarkdownCodeFenceDetails = /```markdown[^`]*<details>/s.test(content);
  console.log(`  ${!hasMarkdownCodeFenceDetails ? '✓' : '✗'} No details inside markdown code fences`);
  if (hasMarkdownCodeFenceDetails) allOk = false;
  
  console.log(allOk ? '\n✓ README structure is valid!' : '\n✗ README has validation errors');
  process.exit(allOk ? 0 : 1);
}

validateReadme().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
