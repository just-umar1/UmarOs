/** @param {string} value */
export function validateUsername(value) {
  const username = value.trim().toLowerCase();
  if (username.length < 3 || username.length > 30 || !/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/.test(username)) return 'Use 3–30 lowercase letters, numbers, or single hyphens; start and end with a letter or number.';
  if (['login','signup','dashboard','explore','privacy','terms','u','api','auth','admin','settings','support'].includes(username)) return 'That username is reserved. Choose another one.';
  return null;
}
/** @param {string} value */
export function safeNextPath(value) {
  return value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : '/dashboard';
}
/** @param {string} value */
export function safePublicUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:'; } catch { return false; }
}
/** @param {string} value @param {number} max */
export function validateText(value, max) {
  const text = value.trim();
  if (!text) return 'This field is required.';
  if (text.length > max) return `Use ${max} characters or fewer.`;
  return null;
}

/** @param {string} value */
export function safePortfolioImage(value) {
  return /^\/media\/[0-9a-f-]{36}\/(?:avatar|[0-9a-f-]{36})\/[a-zA-Z0-9-]+\.(?:jpg|png|webp)$/i.test(value);
}
