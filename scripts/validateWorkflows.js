#!/usr/bin/env node

/**
 * Workflow Validation Script
 * Tests all README update scripts to ensure they work correctly
 */

const fs = require('fs');
const path = require('path');

const README_PATH = path.join(__dirname, '..', 'README.md');

// Color codes for output
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
  } else {
    log(`✗ ${name} markers missing`, 'red');
    if (!hasStart) log(`  Missing: ${startMarker}`, 'yellow');
    if (!hasEnd) log(`  Missing: ${endMarker}`, 'yellow');
    return false;
  }
}

function checkFile(name, filePath) {
  if (fs.existsSync(filePath)) {
    log(`✓ ${name} exists`, 'green');
    return true;
  } else {
    log(`✗ ${name} missing`, 'red');
    log(`  Expected path: ${filePath}`, 'yellow');
    return false;
  }
}

async function main() {
  log('\n=== Workflow Validation Report ===\n', 'blue');
  
  let allPassed = true;
  
  // Check all markers
  log('Checking README markers...', 'blue');
  allPassed &= checkMarker('LATEST_POSTS', '<!-- START: LATEST_POSTS -->', '<!-- END: LATEST_POSTS -->');
  allPassed &= checkMarker('PROJECT_MATRIX', '<!-- START: PROJECT_MATRIX -->', '<!-- END: PROJECT_MATRIX -->');
  allPassed &= checkMarker('REPO_MERMAID', '<!-- START: REPO_MERMAID -->', '<!-- END: REPO_MERMAID -->');
  allPassed &= checkMarker('LEARNING_DYNAMIC', '<!-- START: LEARNING_DYNAMIC -->', '<!-- END: LEARNING_DYNAMIC -->');
  allPassed &= checkMarker('GH_SHOWCASE', '<!-- START: GH_SHOWCASE -->', '<!-- END: GH_SHOWCASE -->');
  allPassed &= checkMarker('UPDATE_TIME', '<!-- UPDATE_TIME -->', '<!-- /UPDATE_TIME -->');
  allPassed &= checkMarker('LAST_SYNC', '<!-- LAST_SYNC -->', '<!-- /LAST_SYNC -->');
  
  log('\nChecking required files...', 'blue');
  allPassed &= checkFile('config/projects.json', path.join(__dirname, '..', 'config', 'projects.json'));
  allPassed &= checkFile('data directory', path.join(__dirname, '..', 'data'));
  
  log('\nChecking scripts...', 'blue');
  allPassed &= checkFile('fetch-project-status.js', path.join(__dirname, 'fetch-project-status.js'));
  allPassed &= checkFile('fetch-gists.js', path.join(__dirname, 'fetch-gists.js'));
  allPassed &= checkFile('updateGists.mjs', path.join(__dirname, 'updateGists.mjs'));
  allPassed &= checkFile('updateProjectMatrix.mjs', path.join(__dirname, 'updateProjectMatrix.mjs'));
  allPassed &= checkFile('buildRepoMermaid.mjs', path.join(__dirname, 'buildRepoMermaid.mjs'));
  allPassed &= checkFile('updateLearning.mjs', path.join(__dirname, 'updateLearning.mjs'));
  allPassed &= checkFile('updateTrending.mjs', path.join(__dirname, 'updateTrending.mjs'));
  allPassed &= checkFile('fetchMetrics.mjs', path.join(__dirname, 'fetchMetrics.mjs'));
  
  log('\nChecking script markers match README...', 'blue');
  
  // Check fetch-project-status.js
  const fetchProjectStatus = fs.readFileSync(path.join(__dirname, 'fetch-project-status.js'), 'utf8');
  if (fetchProjectStatus.includes("'<!-- START: PROJECT_MATRIX -->'") && 
      fetchProjectStatus.includes("'<!-- END: PROJECT_MATRIX -->'")) {
    log('✓ fetch-project-status.js uses correct markers', 'green');
  } else {
    log('✗ fetch-project-status.js uses incorrect markers', 'red');
    allPassed = false;
  }
  
  // Check fetch-gists.js
  const fetchGists = fs.readFileSync(path.join(__dirname, 'fetch-gists.js'), 'utf8');
  if (fetchGists.includes("'<!-- START: LATEST_POSTS -->'") && 
      fetchGists.includes("'<!-- END: LATEST_POSTS -->'")) {
    log('✓ fetch-gists.js uses correct markers', 'green');
  } else {
    log('✗ fetch-gists.js uses incorrect markers', 'red');
    allPassed = false;
  }
  
  // Check all scripts exit gracefully on missing markers
  log('\nChecking error handling...', 'blue');
  const scriptsToCheck = [
    'fetch-project-status.js',
    'fetch-gists.js',
    'updateGists.mjs',
    'updateProjectMatrix.mjs',
    'buildRepoMermaid.mjs',
    'updateLearning.mjs',
    'updateTrending.mjs',
  ];
  
  for (const script of scriptsToCheck) {
    const content = fs.readFileSync(path.join(__dirname, script), 'utf8');
    if (content.includes('process.exit(0)') && 
        content.includes('Skipping update due to missing markers')) {
      log(`✓ ${script} has graceful error handling`, 'green');
    } else {
      log(`⚠ ${script} may not handle errors gracefully`, 'yellow');
    }
  }
  
  log('\n=== Summary ===\n', 'blue');
  if (allPassed) {
    log('✓ All validation checks passed!', 'green');
    log('Workflows should run successfully.', 'green');
  } else {
    log('✗ Some validation checks failed.', 'red');
    log('Please fix the issues above before running workflows.', 'red');
  }
  
  log('');
  process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
  console.error('Validation error:', error);
  process.exit(1);
});
