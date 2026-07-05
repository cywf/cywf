#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const README_PATH = join(process.cwd(), 'README.md');

const REQUIRED_MARKERS = [
  'START: SYSTEM_OVERVIEW',
  'END: SYSTEM_OVERVIEW',
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
  const content = await readFile(README_PATH, 'utf8');
  let ok = true;

  console.log('Checking README markers...');
  for (const marker of REQUIRED_MARKERS) {
    const found = content.includes(`<!-- ${marker} -->`);
    console.log(`  ${found ? '✓' : '✗'} ${marker}`);
    if (!found) ok = false;
  }

  if (content.includes('## 📅 Daily Brief') || content.includes('BEGIN DAILY BRIEF') || content.includes('END DAILY BRIEF')) {
    console.log('  ✗ Daily Brief remnants detected');
    ok = false;
  } else {
    console.log('  ✓ Daily Brief section removed');
  }

  const openDetails = (content.match(/<details>/g) || []).length;
  const closeDetails = (content.match(/<\/details>/g) || []).length;
  console.log(`\nDetails tags: ${openDetails} open / ${closeDetails} close`);
  if (openDetails !== closeDetails) ok = false;

  if (!ok) {
    console.error('\nREADME validation failed');
    process.exit(1);
  }

  console.log('\n✓ README structure is valid');
}

validateReadme().catch((error) => {
  console.error('Error validating README:', error.message);
  process.exit(1);
});
