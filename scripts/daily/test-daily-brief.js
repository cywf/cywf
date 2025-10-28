#!/usr/bin/env node

/**
 * Test Daily Brief
 * Validates the daily brief generation and output structure
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const README_PATH = path.join(__dirname, '..', '..', 'README.md');
const DAILY_DIR = path.join(__dirname, '..', '..', 'daily');

let testsPassed = 0;
let testsFailed = 0;

/**
 * Test helper function
 */
function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error.message}`);
    testsFailed++;
  }
}

/**
 * Assert helper
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

console.log('🧪 Running Daily Brief Tests\n');
console.log('='.repeat(50) + '\n');

// Test 1: Check README has daily brief markers
test('README.md has daily brief markers', () => {
  const readme = fs.readFileSync(README_PATH, 'utf8');
  assert(readme.includes('<!-- BEGIN DAILY BRIEF -->'), 'Missing BEGIN marker');
  assert(readme.includes('<!-- END DAILY BRIEF -->'), 'Missing END marker');
});

// Test 2: Check daily directory exists
test('Daily archive directory exists', () => {
  assert(fs.existsSync(DAILY_DIR), 'Daily directory does not exist');
});

// Test 3: Check if latest archive file exists
test('Archive file exists for today', () => {
  const today = new Date().toISOString().split('T')[0];
  const archivePath = path.join(DAILY_DIR, `${today}.md`);
  assert(fs.existsSync(archivePath), `Archive file ${today}.md does not exist`);
});

// Test 4: Validate archive file structure
test('Archive file has valid front matter', () => {
  const today = new Date().toISOString().split('T')[0];
  const archivePath = path.join(DAILY_DIR, `${today}.md`);
  const content = fs.readFileSync(archivePath, 'utf8');
  
  assert(content.startsWith('---'), 'Missing front matter start');
  assert(content.includes('date:'), 'Missing date field');
  assert(content.includes('title:'), 'Missing title field');
  assert(content.includes('generated:'), 'Missing generated field');
});

// Test 5: Check archive has required sections
test('Archive file has all required sections', () => {
  const today = new Date().toISOString().split('T')[0];
  const archivePath = path.join(DAILY_DIR, `${today}.md`);
  const content = fs.readFileSync(archivePath, 'utf8');
  
  assert(content.includes('📅 Daily Brief'), 'Missing Daily Brief header');
  assert(content.includes('💭 Quote of the Day'), 'Missing Quote section');
  assert(content.includes('🌤️ Weather Report'), 'Missing Weather section');
  assert(content.includes('📰 Global Intelligence News'), 'Missing News section');
  assert(content.includes('🌌 Space Weather'), 'Missing Space Weather section');
  assert(content.includes('🔥 Trending on GitHub'), 'Missing Trending section');
});

// Test 6: Check README brief content
test('README has daily brief content', () => {
  const readme = fs.readFileSync(README_PATH, 'utf8');
  const startMarker = '<!-- BEGIN DAILY BRIEF -->';
  const endMarker = '<!-- END DAILY BRIEF -->';
  
  const startIndex = readme.indexOf(startMarker);
  const endIndex = readme.indexOf(endMarker);
  
  assert(startIndex !== -1 && endIndex !== -1, 'Markers not found');
  
  const briefContent = readme.substring(startIndex, endIndex);
  assert(briefContent.length > 100, 'Brief content is too short');
  assert(briefContent.includes('<details>'), 'Missing collapsible sections');
});

// Test 7: Validate markdown structure
test('Generated markdown is valid', () => {
  const today = new Date().toISOString().split('T')[0];
  const archivePath = path.join(DAILY_DIR, `${today}.md`);
  const content = fs.readFileSync(archivePath, 'utf8');
  
  // Count opening and closing details tags
  const openingTags = (content.match(/<details>/g) || []).length;
  const closingTags = (content.match(/<\/details>/g) || []).length;
  
  assert(openingTags === closingTags, 'Unmatched details tags');
  assert(openingTags >= 5, 'Not enough collapsible sections');
});

// Test 8: Check for proper error handling (no API errors in output)
test('No error messages leaked into output', () => {
  const readme = fs.readFileSync(README_PATH, 'utf8');
  const startMarker = '<!-- BEGIN DAILY BRIEF -->';
  const endMarker = '<!-- END DAILY BRIEF -->';
  
  const briefContent = readme.substring(
    readme.indexOf(startMarker),
    readme.indexOf(endMarker)
  );
  
  assert(!briefContent.includes('Error:'), 'Error message found in output');
  assert(!briefContent.includes('undefined'), 'Undefined values in output');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Results:`);
console.log(`   ✅ Passed: ${testsPassed}`);
console.log(`   ❌ Failed: ${testsFailed}`);
console.log(`   📈 Total: ${testsPassed + testsFailed}`);
console.log('\n' + '='.repeat(50));

// Exit with appropriate code
process.exit(testsFailed > 0 ? 1 : 0);
