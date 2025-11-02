/**
 * Palette utilities for maintaining the dark neon theme
 */

export const brandGreen = '#8AFF8A';
export const brandDark = 'hsl(200, 20%, 3%)';

/**
 * Adjust HSL lightness and saturation of a hex color
 * @param hex - Hex color string (e.g., '#8AFF8A')
 * @param lDelta - Lightness delta (-100 to 100)
 * @param sDelta - Saturation delta (-100 to 100)
 * @returns HSL color string
 */
export function tint(hex: string, lDelta = 0, sDelta = 0): string {
  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // Convert RGB to HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // Apply deltas (as percentages)
  const newS = Math.max(0, Math.min(1, s + sDelta / 100));
  const newL = Math.max(0, Math.min(1, l + lDelta / 100));

  return `hsl(${Math.round(h * 360)}, ${Math.round(newS * 100)}%, ${Math.round(newL * 100)}%)`;
}

/**
 * Get a color for a programming language
 * Falls back to on-brand HSL variations if not found
 */
export async function languageColor(name: string): Promise<string> {
  try {
    const response = await fetch('/data/linguist-colors.json');
    const colors = await response.json();
    if (colors[name]) {
      return colors[name];
    }
  } catch (err) {
    console.warn('Failed to load linguist colors:', err);
  }

  // Fallback: generate a color based on the language name hash
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = (hash * 137.508) % 360; // Golden angle
  return `hsl(${Math.round(hue)}, 60%, 55%)`;
}

/**
 * Generate distinct colors for chart datasets
 */
export function generateChartColors(count: number, baseHue = 150): string[] {
  const colors: string[] = [];
  const goldenAngle = 137.508; // Golden angle for better distribution

  for (let i = 0; i < count; i++) {
    const hue = (baseHue + i * goldenAngle) % 360;
    colors.push(`hsl(${Math.round(hue)}, 65%, 60%)`);
  }

  return colors;
}
