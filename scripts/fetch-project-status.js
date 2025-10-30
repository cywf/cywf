#!/usr/bin/env node

/**
 * Fetch Project Status Script
 * Generates project matrix with test status badges
 * and updates the README.md file with the results.
 */

const fs = require('fs');
const path = require('path');

const USERNAME = 'cywf';
const README_PATH = path.join(__dirname, '..', 'README.md');

// List of projects to track
const PROJECTS = [
  {
    name: 'FortiPath',
    description: 'Advanced network path analysis with ML',
    repo: 'FortiPath'
  },
  {
    name: 'sentinel-project',
    description: 'Autonomous threat detection system',
    repo: 'sentinel-project'
  },
  {
    name: 'AegisNet',
    description: 'AI-driven secure network architecture',
    repo: 'AegisNet'
  },
  {
    name: 'AirwayAtlas',
    description: 'Airway network visualization with GIS',
    repo: 'AirwayAtlas'
  },
  {
    name: 'willow',
    description: 'Multi-agent orchestration framework',
    repo: 'willow'
  },
  {
    name: 'OTG-TAK',
    description: 'Tactical awareness kit for operations',
    repo: 'OTG-TAK'
  },
  {
    name: 'InfraGuard',
    description: 'Infrastructure monitoring & hardening',
    repo: 'InfraGuard'
  },
  {
    name: 'NetNinja',
    description: 'Network reconnaissance & automation',
    repo: 'NetNinja'
  },
  {
    name: 'ZeroTier-Toolkit',
    description: 'ZeroTier network management tools',
    repo: 'ZeroTier-Toolkit'
  },
  {
    name: 'AlphaNest',
    description: 'Secure collaboration platform',
    repo: 'AlphaNest'
  },
  {
    name: 'Boilerplates',
    description: 'Project templates & scaffolding',
    repo: 'Boilerplates'
  },
  {
    name: 'CTF-Kit',
    description: 'Capture The Flag tools & utilities',
    repo: 'CTF-Kit'
  },
  {
    name: 'cywf.github.io',
    description: 'Personal website & portfolio',
    repo: 'cywf.github.io'
  }
];

// Workflow types to check
const WORKFLOW_TYPES = ['test'];

/**
 * Generate the project matrix table
 */
async function generateProjectMatrix() {
  console.log('Generating project matrix...');
  
  const rows = [];
  
  for (const project of PROJECTS) {
    console.log(`Checking ${project.repo}...`);
    
    // Generate badge URL for test status only
    const testBadge = `![Test](https://github.com/${USERNAME}/${project.repo}/actions/workflows/test.yml/badge.svg)`;
    const projectLink = `[View →](https://github.com/${USERNAME}/${project.repo})`;
    
    const row = `| **${project.name}** | ${project.description} | ${testBadge} | ${projectLink} |`;
    rows.push(row);
  }
  
  return rows.join('\n');
}

/**
 * Update README.md with new project matrix
 */
function updateReadme(matrixContent) {
  console.log('Reading README.md...');
  const readme = fs.readFileSync(README_PATH, 'utf8');
  
  const startMarker = '<!-- PROJECT_MATRIX_START -->';
  const endMarker = '<!-- PROJECT_MATRIX_END -->';
  
  const startIndex = readme.indexOf(startMarker);
  const endIndex = readme.indexOf(endMarker);
  
  if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find project matrix markers in README.md');
    process.exit(1);
  }
  
  const tableHeader = `| Project | Description | Test | Link |\n|---------|-------------|------|------|`;
  const newContent = `${startMarker}\n${tableHeader}\n${matrixContent}\n${endMarker}`;
  
  const updatedReadme = readme.substring(0, startIndex) + newContent + readme.substring(endIndex + endMarker.length);
  
  console.log('Writing updated README.md...');
  fs.writeFileSync(README_PATH, updatedReadme, 'utf8');
  console.log('README.md updated successfully!');
}

/**
 * Main execution
 */
async function main() {
  try {
    const matrix = await generateProjectMatrix();
    updateReadme(matrix);
  } catch (error) {
    if (error.code && ['ENETUNREACH', 'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'].includes(error.code)) {
      console.warn(`Network issue encountered (${error.code}). Skipping README update for now.`);
      return;
    }

    console.error('Error updating README:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
