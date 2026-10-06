import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchWikipedia, fetchJson, fetchLocal } from './lib/fetchers.mjs';
import { normalizeWikipedia, normalizeRawJson } from './lib/normalize.mjs';
import { isCompatible, matchesKeywords, dedupe } from './lib/filter.mjs';
import { sleep, log } from './lib/utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

async function loadConfig() {
  const raw = await fs.readFile(path.join(__dirname, 'sources.json'), 'utf-8');
  return JSON.parse(raw);
}

async function loadExisting(outputFile) {
  try {
    const raw = await fs.readFile(outputFile, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.entities) ? parsed.entities : [];
  } catch {
    return [];
  }
}

async function runOneSource(source, config) {
  const collected = [];

  if (source.type === 'wikipedia') {
    for (const q of source.queries ?? []) {
      try {
        const raw = await fetchWikipedia(q);
        if (!raw) continue;

        const normalized = normalizeWikipedia(raw, q, source.id);
        if (!normalized) continue;
        if (!isCompatible(normalized)) {
          log('⏭️', `غير متوافق: ${normalized.titleAr}`);
          continue;
        }
        if (!matchesKeywords(normalized, q.keywords)) {
          log('🔍', `كلمات مفتاحية غير مطابقة: ${normalized.titleAr}`);
          continue;
        }

        collected.push(normalized);
        log('✅', `${normalized.entityType} · ${normalized.titleAr} (${normalized.fullText.length} حرف)`);
      } catch (e) {
        log('❌', `فشل ${q.searchTerm}: ${e.message}`);
      }
      await sleep(config.rateLimitMs ?? 800);
    }
  } else if (source.type === 'json') {
    try {
      const data = await fetchJson(source);
      const items = Array.isArray(data) ? data : (data.items ?? []);
      for (const item of items) {
        const n = normalizeRawJson(item, source.id);
        if (n && isCompatible(n) && matchesKeywords(n, item.keywords ?? [])) {
          collected.push(n);
        }
      }
    } catch (e) {
      log('❌', `فشل JSON: ${e.message}`);
    }
  } else if (source.type === 'local') {
    try {
      const data = await fetchLocal(source);
      const items = Array.isArray(data) ? data : (data.items ?? []);
      for (const item of items) {
        const n = normalizeRawJson(item, source.id);
        if (n && isCompatible(n) && matchesKeywords(n, item.keywords ?? [])) {
          collected.push(n);
        }
      }
    } catch (e) {
      log('❌', `فشل Local: ${e.message}`);
    }
  }

  return collected;
}

async function main() {
  console.log('\n══════════════════════════════════════════');
  console.log('📚 Knowledge Sync — استيراد المعرفة الخارجية');
  console.log('══════════════════════════════════════════\n');

  const config = await loadConfig();
  const outputPath = path.join(ROOT, config.outputFile);

  log('📂', `المخرَج: ${config.outputFile}`);
  log('📋', `عدد المصادر: ${config.sources.length}\n`);

  const existing = await loadExisting(outputPath);
  log('📦', `الموجود مسبقاً: ${existing.length} كيان\n`);

  const fresh = [];

  for (const source of config.sources) {
    if (!source.enabled) {
      log('⏭️', `تخطّي (معطّل): ${source.id}`);
      continue;
    }
    log('🔷', `المصدر: ${source.id} [${source.type}]`);
    const items = await runOneSource(source, config);
    fresh.push(...items);
    log('', '');
  }

  const merged = dedupe([...fresh, ...existing]);
  const added = merged.length - existing.length;

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(
    outputPath,
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      total: merged.length,
      byType: merged.reduce((acc, e) => {
        acc[e.entityType] = (acc[e.entityType] ?? 0) + 1;
        return acc;
      }, {}),
      entities: merged,
    }, null, 2),
    'utf-8'
  );

  console.log('\n══════════════════════════════════════════');
  log('✨', `جديد: ${added}`);
  log('📊', `الإجمالي: ${merged.length}`);
  log('💾', `حُفظ في: ${config.outputFile}`);
  console.log('══════════════════════════════════════════\n');
}

main().catch((e) => {
  console.error('❌ فشل عام:', e);
  process.exit(1);
});
