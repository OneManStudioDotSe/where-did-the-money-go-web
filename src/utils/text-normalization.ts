/**
 * Text normalization utilities for improved category matching
 *
 * These functions normalize text for MATCHING ONLY - the original
 * transaction descriptions are never modified for display.
 */

/**
 * Normalize Swedish text for matching purposes
 * Converts to lowercase and normalizes Swedish/Nordic characters
 *
 * Example: "CAFÉ MALMÖ" → "cafe malmo"
 * Example: "HEMKÖP" → "hemkop"
 */
export function normalizeSwedish(text: string): string {
  return text
    .toLowerCase()
    // Handle common Swedish/Nordic characters
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    // Handle accented characters (café → cafe)
    .replace(/é|è|ê|ë/g, 'e')
    .replace(/á|à|â|ã/g, 'a')
    .replace(/í|ì|î|ï/g, 'i')
    .replace(/ó|ò|ô|õ/g, 'o')
    .replace(/ú|ù|û/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/ç/g, 'c')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenize text into words for matching
 * Splits on spaces and common separators, filters short tokens
 *
 * Example: "MAX HAMBURGERRESTAURANGER AB" → ["max", "hamburgerrestauranger", "ab"]
 */
export function tokenize(text: string): string[] {
  return normalizeSwedish(text)
    .split(/[\s\-_\/]+/)
    .filter(token => token.length > 0);
}

/**
 * Check if all significant tokens from the pattern exist in the description
 * Tokens shorter than minTokenLength are considered insignificant (like "AB", "I")
 *
 * Example:
 *   description: "MAX HAMBURGERRESTAURANGER AB STOCKHOLM"
 *   pattern: "MAX HAMBURGER"
 *   Result: true (both "max" and "hamburger" are found as substrings)
 */
export function tokenMatch(
  description: string,
  pattern: string,
  minTokenLength: number = 3
): boolean {
  const normalizedDesc = normalizeSwedish(description);
  const patternTokens = tokenize(pattern);

  // All significant pattern tokens must be found in the description
  return patternTokens.every(token => {
    // Skip very short tokens (like "AB", "I", "A")
    if (token.length < minTokenLength) {
      return true;
    }
    // Check if the token exists as a substring in the description
    return normalizedDesc.includes(token);
  });
}

/**
 * Enhanced pattern matching with Swedish normalization
 * Uses normalized comparison for better matching across character variations
 *
 * This is used as a fallback when exact matching fails
 */
export function normalizedContains(description: string, pattern: string): boolean {
  const normalizedDesc = normalizeSwedish(description);
  const normalizedPattern = normalizeSwedish(pattern);
  return normalizedDesc.includes(normalizedPattern);
}

/**
 * Enhanced starts-with matching with Swedish normalization
 */
export function normalizedStartsWith(description: string, pattern: string): boolean {
  const normalizedDesc = normalizeSwedish(description);
  const normalizedPattern = normalizeSwedish(pattern);
  return normalizedDesc.startsWith(normalizedPattern);
}

/**
 * Enhanced exact matching with Swedish normalization
 */
export function normalizedExact(description: string, pattern: string): boolean {
  const normalizedDesc = normalizeSwedish(description);
  const normalizedPattern = normalizeSwedish(pattern);
  return normalizedDesc === normalizedPattern;
}
