/**
 * Utilities for handling basePath in GitHub Pages deployment
 */

const BASE_PATH = process.env.NODE_ENV === 'production' ? '/cywf' : '';

/**
 * Prefix a path with the basePath for GitHub Pages
 * @param path - The path to prefix
 * @returns The prefixed path
 */
export function prefixPath(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_PATH}${cleanPath}`;
}

/**
 * Get the base path for the application
 * @returns The base path
 */
export function getBasePath(): string {
  return BASE_PATH;
}
