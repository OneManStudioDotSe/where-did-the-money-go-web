/**
 * Convert a string to Title Case (first letter of each word capitalized)
 * Handles special cases like all-caps words and preserves certain acronyms
 */
export function toTitleCase(str: string): string {
  if (!str) return str;

  // First, normalize the string: if it's all uppercase, lowercase it first
  const normalized = str === str.toUpperCase() ? str.toLowerCase() : str;

  return normalized
    .split(' ')
    .map(word => {
      if (!word) return word;
      // Keep short words like 'AB', 'AB' in their original form if they're likely acronyms
      if (word.length <= 2 && word === word.toUpperCase()) {
        return word;
      }
      // Capitalize first letter, keep rest as is (to preserve camelCase etc)
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
