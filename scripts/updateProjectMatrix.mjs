#!/usr/bin/env node

/**
 * Update Project Matrix
 * Fetches workflow status and updates project matrix with CI badges
 */

import { Octokit } from '@octokit/rest';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const README_PATH = join(process.cwd(), 'README.md');
const PROJECTS_PATH = join(process.cwd(), 'config', 'projects.json');

if (!GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

/**
 * Load projects configuration
 */
async function loadProjects() {
  try {
    const content = await readFile(PROJECTS_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading projects.json:', error.message);
    process.exit(1);
  }
}

/**
 * Get workflows for a repository
 */
async function getWorkflows(owner, repo) {
  try {
    const { data } = await octokit.rest.actions.listRepoWorkflows({
      owner,
      repo,
    });
    
    return data.workflows || [];
  } catch (error) {
    if (error.status === 404) {
      console.log(`  Repository ${owner}/${repo} not found or no access`);
      return [];
    }
    console.warn(`  Warning: Could not fetch workflows for ${owner}/${repo}:`, error.message);
    return [];
  }
}

/**
 * Find the best workflow to display
 */
function findBestWorkflow(workflows) {
  if (workflows.length === 0) return null;
  
  // Prefer workflows with 'test' in the name
  const testWorkflow = workflows.find(w => 
    w.name.toLowerCase().includes('test') || 
    w.path.toLowerCase().includes('test')
  );
  
  if (testWorkflow) return testWorkflow;
  
  // Prefer workflows with 'ci' in the name
  const ciWorkflow = workflows.find(w => 
    w.name.toLowerCase().includes('ci') || 
    w.path.toLowerCase().includes('ci')
  );
  
  if (ciWorkflow) return ciWorkflow;
  
  // Return the first workflow
  return workflows[0];
}

/**
 * Get default branch for a repository
 */
async function getDefaultBranch(owner, repo) {
  try {
    const { data } = await octokit.rest.repos.get({
      owner,
      repo,
    });
    
    return data.default_branch || 'main';
  } catch (error) {
    console.warn(`  Warning: Could not fetch default branch for ${owner}/${repo}, using 'main'`);
    return 'main';
  }
}

/**
 * Generate CI badge for a project
 */
async function generateCIBadge(owner, repo) {
  const workflows = await getWorkflows(owner, repo);
  
  if (workflows.length === 0) {
    return 'No CI';
  }
  
  const workflow = findBestWorkflow(workflows);
  const workflowFile = workflow.path.split('/').pop(); // Get filename from path
  const branch = await getDefaultBranch(owner, repo);
  
  const badgeUrl = `https://github.com/${owner}/${repo}/actions/workflows/${workflowFile}/badge.svg?branch=${branch}`;
  
  return `![CI](${badgeUrl})`;
}

/**
 * Generate View project button
 */
function generateViewButton(owner, repo) {
  const url = `https://github.com/${owner}/${repo}`;
  return `<a href="${url}"><img alt="View project" src="https://img.shields.io/badge/View%20project-1f6feb?style=for-the-badge"></a>`;
}

/**
 * Generate project matrix table
 */
async function generateProjectMatrix(projects) {
  console.log(`Generating project matrix for ${projects.length} projects...`);
  
  const rows = [];
  
  for (const project of projects) {
    console.log(`Processing ${project.owner}/${project.repo}...`);
    
    const badge = await generateCIBadge(project.owner, project.repo);
    const button = generateViewButton(project.owner, project.repo);
    
    rows.push(`| **${project.repo}** | ${project.desc} | ${badge} | ${button} |`);
  }
  
  return rows.join('\n');
}

/**
 * Update README with project matrix
 */
async function updateReadme(matrixTable) {
  console.log('Reading README.md...');
  const readme = await readFile(README_PATH, 'utf8');
  
  const startMarker = '<!-- START: PROJECT_MATRIX -->';
  const endMarker = '<!-- END: PROJECT_MATRIX -->';
  
  const startIndex = readme.indexOf(startMarker);
  const endIndex = readme.indexOf(endMarker);
  
  if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find PROJECT_MATRIX markers in README.md');
    console.error(`Expected markers: '${startMarker}' and '${endMarker}'`);
    console.error('Please ensure these markers exist in README.md before running this script.');
    
    // Exit gracefully for CI
    console.log('Skipping update due to missing markers.');
    process.exit(0);
  }
  
  const tableHeader = `| Project | Description | Test | Link |\n|---------|-------------|------|------|`;
  const newContent = `${startMarker}\n${tableHeader}\n${matrixTable}\n${endMarker}`;
  
  const updatedReadme = readme.substring(0, startIndex) + newContent + readme.substring(endIndex + endMarker.length);
  
  console.log('Writing updated README.md...');
  await writeFile(README_PATH, updatedReadme, 'utf8');
  console.log('✓ README.md updated successfully!');
}

/**
 * Main execution
 */
async function main() {
  try {
    const projects = await loadProjects();
    const matrixTable = await generateProjectMatrix(projects);
    await updateReadme(matrixTable);
    console.log('✓ Project matrix update complete!');
  } catch (error) {
    console.error('Error updating project matrix:', error.message);
    process.exit(1);
  }
}

main();
