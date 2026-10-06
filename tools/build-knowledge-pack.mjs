#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// build-knowledge-pack.mjs — يحزم src/data في Knowledge Pack
// ═══════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PACK_DIR = path.join(ROOT, 'knowledge-packs/core-jafr');

const PACK_VERSION = process.env.PACK_VERSION ?? '1.0.0';
const PACK_ID = 'core-jafr';

// ═══════════════════════════════════════════════════════════
function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function fileSize(file) {
  try { return fs.statSync(file).size; } catch { return 0; }
}

function readIfExists(file) {
  try { return fs.readFileSync(file, 'utf-8'); } catch { return null; }
}

// ═══════════════════════════════════════════════════════════
// 1) اجمع كل المعرفة من src/data
// ═══════════════════════════════════════════════════════════
function collectDataFiles() {
  const dataDir = path.join(ROOT, 'src/data');
  const out = { ts: [], json: [] };

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'external') continue; // سنعالجها لاحقاً
        walk(full);
      } else if (entry.name.endsWith('.ts')) {
        out.ts.push(full);
      } else if (entry.name.endsWith('.json')) {
        out.json.push(full);
      }
    }
  }
  walk(dataDir);
  return out;
}

// ═══════════════════════════════════════════════════════════
// 2) اجمع الكيانات من KB
// ═══════════════════════════════════════════════════════════
async function collectEntities() {
  const externalPath = path.join(ROOT, 'src/data/external/entities.json');
  const external = readIfExists(externalPath);
  let externalData = null;
  if (external) {
    try { externalData = JSON.parse(external); } catch {}
  }

  return {
    external: externalData?.entities ?? [],
    externalMeta: externalData?.metadata ?? {},
  };
}

// ═══════════════════════════════════════════════════════════
// 3) احسب checksums
// ═══════════════════════════════════════════════════════════
function buildChecksums(files) {
  const lines = [];
  for (const f of files) {
    const content = readIfExists(f);
    if (!content) continue;
    const rel = path.relative(ROOT, f);
    lines.push(`${sha256(content)}  ${rel}`);
  }
  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════
// 4) ابنِ Knowledge Pack
// ═══════════════════════════════════════════════════════════
async function main() {
  console.log('📦 بناء Knowledge Pack v' + PACK_VERSION);
  console.log('   مجلد المصدر: src/data');
  console.log('   مجلد الهدف: knowledge-packs/core-jafr');

  fs.mkdirSync(PACK_DIR, { recursive: true });

  // 1) اجمع
  const files = collectDataFiles();
  const entities = await collectEntities();

  console.log(`   ملفات TS: ${files.ts.length}`);
  console.log(`   ملفات JSON: ${files.json.length}`);
  console.log(`   كيانات خارجية: ${entities.external.length}`);

  // 2) انسخ ملفات TS/JSON إلى الوحدة
  const packDataDir = path.join(PACK_DIR, 'data');
  fs.mkdirSync(packDataDir, { recursive: true });

  const copiedFiles = [];
  for (const f of [...files.ts, ...files.json]) {
    const rel = path.relative(path.join(ROOT, 'src/data'), f);
    const dest = path.join(packDataDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(f, dest);
    copiedFiles.push(f);
  }

  // 3) احفظ الكيانات الخارجية كملف واحد منظّم
  if (entities.external.length > 0) {
    fs.writeFileSync(
      path.join(PACK_DIR, 'external-entities.json'),
      JSON.stringify({ entities: entities.external, metadata: entities.externalMeta }, null, 2),
      'utf-8'
    );
  }

  // 4) ابنِ manifest
  const tsContent = files.ts.map(readIfExists).filter(Boolean).join('\n');
  const jsonContent = files.json.map(readIfExists).filter(Boolean).join('\n');
  const fullHash = sha256(tsContent + jsonContent);

  const manifest = {
    $schema: 'https://knowledgeatlas.dev/schema/pack-v1.json',
    id: PACK_ID,
    name: 'Core Jafr Knowledge Pack',
    nameAr: 'حزمة المعرفة الجفرية الأساسية',
    version: PACK_VERSION,
    releasedAt: new Date().toISOString(),

    description: 'Knowledge package for the KnowledgeAtlas Sovereign engine. Includes roots, planets, signs, houses, elements, letters, remedies, and jafr methodology.',

    license: {
      type: 'Proprietary',
      copyrightHolder: 'Mohammed Saeed',
      terms: 'All rights reserved. For use within KnowledgeAtlas Sovereign platform.',
      contact: 'mohammedsaeed95@gmail.com',
    },

    source: {
      name: 'Imam al-Buni tradition + scholarly references',
      provenance: 'Combines classical Arabic symbolist knowledge with structured methodology.',
      disclaimer: 'Symbolic interpretation only — not medical, legal, or financial advice.',
    },

    contents: {
      dataFiles: files.ts.length + files.json.length,
      tsFiles: files.ts.length,
      jsonFiles: files.json.length,
      externalEntities: entities.external.length,
      externalByType: entities.externalMeta.byType ?? {},
    },

    integrity: {
      algorithm: 'sha256',
      hash: fullHash,
      checksumsFile: 'checksums.txt',
    },

    compatibility: {
      engineVersion: '^2.0.0',
      appVersion: '^2.11.0',
      minSchemaVersion: '1.0.0',
    },

    files: {
      checksums: 'checksums.txt',
      externalEntities: entities.external.length > 0 ? 'external-entities.json' : null,
      dataDir: 'data/',
    },
  };

  fs.writeFileSync(
    path.join(PACK_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );

  // 5) checksums
  const checksums = buildChecksums([
    ...files.ts,
    ...files.json,
  ]);
  fs.writeFileSync(path.join(PACK_DIR, 'checksums.txt'), checksums, 'utf-8');

  // 6) README للوحدة
  const readme = `# Core Jafr Knowledge Pack v${PACK_VERSION}

## 🎯 الوصف
حزمة المعرفة الأساسية لنظام KnowledgeAtlas Sovereign.
تحتوي على كيانات الجفر الطبي (جذور، كواكب، أبراج، بيوت، طبائع، حروف، ترياقات).

## 📦 المحتوى
- **${files.ts.length}** ملف TypeScript (بيانات)
- **${files.json.length}** ملف JSON (بيانات منظّمة)
- **${entities.external.length}** كيان خارجي (مُدمج)
- **${copiedFiles.length}** ملف إجمالي

## 🔐 التحقق
\`\`\`bash
cd knowledge-packs/core-jafr
sha256sum -c checksums.txt
\`\`\`

## 🧬 Hash
\`\`\`
${fullHash}
\`\`\`

## 📄 الترخيص
Proprietary — جميع الحقوق محفوظة لـ Mohammed Saeed.
الاتصال: mohammedsaeed95@gmail.com

## ⚠️ تنبيه
هذه الحزمة **للتأمل الرمزي فقط** — ليست نصيحة طبية أو قانونية أو مالية.
كل نتيجة يجب أن تُقرأ كخريطة تأمل، لا كحكم.

## 🔄 التوافق
- المحرك: \`^2.0.0\`
- التطبيق: \`^2.11.0\`
- Schema: \`1.0.0\`

## 📅 تاريخ الإصدار
${new Date().toISOString().slice(0, 10)}
`;

  fs.writeFileSync(path.join(PACK_DIR, 'README.md'), readme, 'utf-8');

  // 7) اطبع الملخص
  console.log('');
  console.log('══════════════════════════════════════════');
  console.log('✅ Knowledge Pack v' + PACK_VERSION + ' جاهز');
  console.log('══════════════════════════════════════════');
  console.log(`📁 المسار: knowledge-packs/core-jafr/`);
  console.log(`📄 manifest.json: ${fileSize(path.join(PACK_DIR, 'manifest.json'))} بايت`);
  console.log(`🔐 Hash: ${fullHash.slice(0, 16)}...`);
  console.log(`📊 ${copiedFiles.length} ملف منسوخ`);
  console.log('');
  console.log('الملفات المُنشأة:');
  for (const f of fs.readdirSync(PACK_DIR)) {
    const stat = fs.statSync(path.join(PACK_DIR, f));
    const size = stat.isDirectory() ? '[dir]' : `${stat.size} ب`;
    console.log(`  ${f.padEnd(30)} ${size}`);
  }
}

main().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
