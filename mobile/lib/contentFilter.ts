/** Basic client-side filter for common objectionable language (Apple 1.2). */
const BLOCKED_PATTERNS: RegExp[] = [
  /\bf+u+c+k+/i,
  /\bs+h+i+t+/i,
  /\ba+s+s+h+o+l+e+/i,
  /\bb+i+t+c+h+/i,
  /\bn+i+g+g+/i,
  /\bc+u+n+t+/i,
  /\bf+a+g+g?o+t+/i,
  /\br+a+p+e+/i,
  /\bk+i+l+l\s+y+o+u+r+s+e+l+f+/i,
];

export function findObjectionableMatch(text: string): string | null {
  const value = text.trim();
  if (!value) return null;
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(value)) {
      return 'This text contains language that isn’t allowed. Please revise and try again.';
    }
  }
  return null;
}

export function assertAllowedContent(...parts: string[]): void {
  for (const part of parts) {
    const message = findObjectionableMatch(part);
    if (message) throw new Error(message);
  }
}
