import { log } from './utils.mjs';

// ═══════════════════════════════════════════════════════════
// Wikipedia Arabic
// ═══════════════════════════════════════════════════════════
export async function fetchWikipedia(query) {
  const url = new URL('https://ar.wikipedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('prop', 'extracts|info');
  url.searchParams.set('explaintext', '1');
  url.searchParams.set('exsectionformat', 'plain');
  url.searchParams.set('inprop', 'url');
  url.searchParams.set('titles', query.searchTerm);
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');
  url.searchParams.set('redirects', '1');

  log('🌐', `Wikipedia: ${query.searchTerm}`);

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'KnowledgeAtlas/1.0 (offline-app)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  const pages = data?.query?.pages ?? {};
  const page = Object.values(pages)[0];

  if (!page || page.missing !== undefined) {
    log('⚠️', `لا توجد صفحة: ${query.searchTerm}`);
    return null;
  }

  const fullText = (page.extract ?? '').trim();
  if (fullText.length < 100) {
    log('⚠️', `نص قصير جداً: ${query.searchTerm}`);
    return null;
  }

  return {
    titleAr: query.titleAr ?? page.title,
    title: page.title,
    fullText,
    summary: fullText.slice(0, 280) + '...',
    url: page.fullurl,
    pageId: page.pageid,
  };
}

// ═══════════════════════════════════════════════════════════
// Generic JSON
// ═══════════════════════════════════════════════════════════
export async function fetchJson(source) {
  log('🌐', `JSON: ${source.url}`);
  const res = await fetch(source.url, {
    headers: { 'User-Agent': 'KnowledgeAtlas/1.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

// ═══════════════════════════════════════════════════════════
// Local file
// ═══════════════════════════════════════════════════════════
export async function fetchLocal(source) {
  const fs = await import('node:fs/promises');
  log('📁', `Local: ${source.path}`);
  const raw = await fs.readFile(source.path, 'utf-8');
  return JSON.parse(raw);
}
