import crypto from 'node:crypto';

export function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export function normalizeArabic(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\u064B-\u0652]/g, '')      // حركات
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function slugify(text) {
  return normalizeArabic(text).replace(/\s+/g, '_').slice(0, 40);
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function log(emoji, msg) {
  console.log(`${emoji} ${msg}`);
}
