#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const README_PATH = path.join(__dirname, '..', 'README.md');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkMarker(name, startMarker, endMarker) {
  const readme = fs.readFileSync(README_PATH, 'utf8');
  const hasStart = readme.includes(startMarker);
  const hasEnd = readme.includes(endMarker);

  if (hasStart && hasEnd) {
    log(`✓ ${name} markers found`, 'green');
    return true;
  }

  log(`✗ ${name} markers missing`, 'red');
  if (!hasStart) log(`  Missing: ${startMarker}`, 'yellow');
  if (!hasEnd) log(`  Missing: ${endMarker}`, 'yellow');
  return false;
}

function checkFile(name, filePath) {
  if (fs.existsSync(filePath)) {
    log(`✓ ${name} exists`, 'green');
    return true;
  }
  log(`✗ ${name} missing`, 'red');
  log(`  Expected path: ${filePath}`, 'yellow');
  return false;
}

async function main() {
  log('\n=== Workflow Validation Report ===\n', 'blue');
  let allPassed = true;

  log('Checking README markers...', 'blue');
  allPassed &= checkMarker('SYSTEM_OVERVIEW', '<!-- START: SYSTEM_OVERVIEW -->', '<!-- END: SYSTEM_OVERVIEW -->');
  allPassed &= checkMarker('LATEST_POSTS', '<!-- START: LATEST_POSTS -->', '<!-- END: LATEST_POSTS -->');
  allPassed &= checkMarker('PROJECT_MATRIX', '<!-- START: PROJECT_MATRIX -->', '<!-- END: PROJECT_MATRIX -->');
  allPassed &= checkMarker('REPO_MERMAID', '<!-- START: REPO_MERMAID -->', '<!-- END: REPO_MERMAID -->');
  allPassed &= checkMarker('LEARNING_DYNAMIC', '<!-- START: LEARNING_DYNAMIC -->', '<!-- END: LEARNING_DYNAMIC -->');
  allPassed &= checkMarker('GH_SHOWCASE', '<!-- START: GH_SHOWCASE -->', '<!-- END: GH_SHOWCASE -->');
  allPassed &= checkMarker('UPDATE_TIME', '<!-- UPDATE_TIME -->', '<!-- /UPDATE_TIME -->');
  allPassed &= checkMarker('LAST_SYNC', '<!-- LAST_SYNC -->', '<!-- /LAST_SYNC -->');

  const readme = fs.readFileSync(README_PATH, 'utf8');
  if (readme.includes('## 📅 Daily Brief') || readme.includes('BEGIN DAILY BRIEF')) {
    log('✗ Daily Brief remnants still present', 'red');
    allPassed = false;
  } else {
    log('✓ Daily Brief section removed', 'green');
  }

  log('\nChecking required files...', 'blue');
  allPassed &= checkFile('config/projects.json', path.join(__dirname, '..', 'config', 'projects.json'));
  allPassed &= checkFile('data directory', path.join(__dirname, '..', 'data'));
  allPassed &= checkFile('publicRepoData.mjs', path.join(__dirname, 'publicRepoData.mjs'));
  allPassed &= checkFile('updateOverview.mjs', path.join(__dirname, 'updateOverview.mjs'));
  allPassed &= checkFile('updateProjectMatrix.mjs', path.join(__dirname, 'updateProjectMatrix.mjs'));
  allPassed &= checkFile('updateLearning.mjs', path.join(__dirname, 'updateLearning.mjs'));
  allPassed &= checkFile('updateTrending.mjs', path.join(__dirname, 'updateTrending.mjs'));
  allPassed &= checkFile('validateReadme.mjs', path.join(__dirname, 'validateReadme.mjs'));

  log('\n=== Summary ===\n', 'blue');
  if (allPassed) {
    log('✓ All validation checks passed!', 'green');
  } else {
    log('✗ Some validation checks failed.', 'red');
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  console.error('Validation error:', error);
  process.exit(1);
});
