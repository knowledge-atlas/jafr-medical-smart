import { sha256, slugify } from './utils.mjs';

export function normalizeWikipedia(raw, query, sourceId) {
  if (!raw) return null;
  const id = `ext_${sourceId}_${query.entityType}_${slugify(query.titleAr)}_${sha256(raw.titleAr).slice(0, 6)}`;
  return {
    id,
    entityType: query.entityType,
    entityNumber: query.entityNumber,
    title: raw.title,
    titleAr: query.titleAr ?? raw.title,
    fullText: raw.fullText,
    summary: raw.summary,
    sourceType: 'external',
    sourceFile: `${sourceId}:${query.lens ?? 'general'}`,
    sha256: sha256(raw.fullText),
    keywords: query.keywords ?? [],
    metadata: {
      url: raw.url,
      pageId: raw.pageId,
      importedAt: new Date().toISOString(),
      sourceId,
      lens: query.lens ?? 'general',
      lensLabel: query.lensLabel ?? 'عام',
    },
  };
}

export function normalizeRawJson(item, sourceId) {
  if (!item || !item.fullText || !item.titleAr || !item.entityType) return null;
  const id = item.id ?? `ext_${sourceId}_${item.entityType}_${slugify(item.titleAr)}_${sha256(item.fullText).slice(0, 6)}`;
  return {
    id,
    entityType: item.entityType,
    entityNumber: item.entityNumber,
    title: item.title ?? item.titleAr,
    titleAr: item.titleAr,
    fullText: item.fullText,
    summary: item.summary ?? item.fullText.slice(0, 280) + '...',
    sourceType: 'external',
    sourceFile: `${sourceId}:${item.lens ?? 'general'}`,
    sha256: sha256(item.fullText),
    keywords: item.keywords ?? [],
    metadata: {
      ...(item.metadata ?? {}),
      importedAt: new Date().toISOString(),
      sourceId,
      lens: item.lens ?? 'general',
      lensLabel: item.lensLabel ?? 'عام',
    },
  };
}
