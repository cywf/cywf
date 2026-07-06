import { readFile, writeFile } from 'node:fs/promises';

export function replaceBetweenMarkers(content, startMarker, endMarker, replacement) {
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`README marker pair missing or out of order: ${startMarker} … ${endMarker}`);
  }
  return `${content.slice(0, startIndex)}${replacement}${content.slice(endIndex + endMarker.length)}`;
}

export async function replaceReadmeSection(path, startMarker, endMarker, replacement) {
  const content = await readFile(path, 'utf8');
  await writeFile(
    path,
    replaceBetweenMarkers(content, startMarker, endMarker, replacement),
    'utf8'
  );
}

export function markdownEscape(value) {
  return String(value ?? '—')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
}
