#!/usr/bin/env node
// ================================================================
// معالج مسبق لموسوعة الجفر — ينتج JSON نظيفاً بدون تكرار
// ================================================================
// الاستخدام: node scripts/cleanEncyclopedia.js
// المدخل:  src/data/jafr_encyclopedia_FULL_v2.json
// المخرج:  src/data/jafr_encyclopedia_CLEAN.json
// ================================================================

const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, '../src/data/jafr_encyclopedia_FULL_v2.json');
const OUTPUT = path.join(__dirname, '../src/data/jafr_encyclopedia_CLEAN.json');

console.log('═══════════════════════════════════════════════════════════');
console.log('   🧹 معالج تنظيف الموسوعة الجفرية');
console.log('═══════════════════════════════════════════════════════════\n');

// ────────────────────────────────────────────────
// 1. قراءة الملف
// ────────────────────────────────────────────────
console.log(`📖 قراءة: ${INPUT}`);
const raw = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));
console.log(`   ✓ schema: ${raw.schema_version}`);
console.log(`   ✓ عدد الجذور: ${raw.roots?.length || 0}\n`);

// ────────────────────────────────────────────────
// 2. دوال استخراج الأقسام
// ────────────────────────────────────────────────

/**
 * يستخرج قسماً محدداً (A, C, أو غيره) من النص.
 * يبدأ من "## X." وينتهي عند العنوان التالي.
 */
function extractSection(text, letter) {
  if (!text) return '';

  // ابحث عن بداية القسم
  const startRegex = new RegExp(`(^|\\n)##\\s*${letter}\\.\\s`, 'i');
  const startMatch = text.match(startRegex);
  if (!startMatch) return '';

  const startIdx = startMatch.index + startMatch[0].length - 1;

  // ابحث عن العنوان التالي (أي حرف غير letter)
  const afterStart = text.substring(startIdx + 1);
  const nextRegex = new RegExp(`\\n##\\s*(?!${letter}\\.)[A-Z]\\.\\s`, 'i');
  const nextMatch = afterStart.match(nextRegex);

  let section;
  if (nextMatch) {
    section = text.substring(startIdx, startIdx + 1 + nextMatch.index);
  } else {
    section = text.substring(startIdx);
  }

  return section.trim();
}

/**
 * يستخرج العنوان الرئيسي النظيف (مثل: "الجذر 2 — الدبلوماسي")
 */
function extractCleanTitle(text) {
  if (!text) return '';
  const match = text.match(/ROOT_\d+\s*[—–-]\s*الجذر\s+\d+\s*[—–-]\s*(.+?)(?:\n|$)/);
  if (match) return match[1].trim();

  const match2 = text.match(/الجذر\s+(\d+)\s*[–—\-]\s*(.+?)(?:\n|$)/);
  if (match2) return match2[2].trim();

  return '';
}

/**
 * تنظيف قسم من المخلفات التقنية
 */
function cleanSection(section) {
  if (!section) return '';

  let cleaned = section;

  // 1. إزالة compatibleWith / conflictsWith
  cleaned = cleaned.replace(/\s*,\s*compatibleWith\s*:\s*\[[^\]]*\]/gi, '');
  cleaned = cleaned.replace(/\s*,?\s*conflictsWith\s*:\s*\[[^\]]*\]\s*\}?/gi, '');

  // 2. إزالة أسطر JSON keys
  const jsonKeyPatterns = [
    /^\s*"[^"]+"\s*:\s*\{.*$/gm,
    /^\s*id\s*:\s*"[^"]+".*$/gm,
    /^\s*name\s*:\s*"[^"]+".*$/gm,
    /^\s*fullDescription\s*:.*$/gm,
    /^\s*glyph\s*:\s*"[^"]+".*$/gm,
    /^\s*abjadValue\s*:.*$/gm,
    /^\s*element\s*:\s*"[^"]+".*$/gm,
    /^\s*type\s*:\s*"[^"]+".*$/gm,
    /^\s*title\s*:\s*"[^"]+".*$/gm,
    /^\s*jafr_name\s*:.*$/gm,
    /^\s*jafr_role\s*:.*$/gm,
    /^\s*jafr_remedy\s*:.*$/gm,
    /^\s*visible_features\s*:.*$/gm,
    /^\s*hidden_features\s*:.*$/gm,
    /^\s*symbols\s*:.*$/gm,
    /^\s*relations\s*:.*$/gm,
    /^\s*shadow\s*:.*$/gm,
    /^\s*weakness\s*:.*$/gm,
    /^\s*remedy\s*:.*$/gm,
    /^\s*remainder\s*:.*$/gm,
    /^\s*confidence\s*:.*$/gm,
    /^\s*wafq_type\s*:.*$/gm,
    /^\s*interpretation\s*:.*$/gm,
  ];
  for (const p of jsonKeyPatterns) cleaned = cleaned.replace(p, '');

  // 3. إزالة الأقواس المعلقة
  cleaned = cleaned.replace(/^\s*[\{\}],?\s*$/gm, '');
  cleaned = cleaned.replace(/\s*,\s*\}/g, '');
  cleaned = cleaned.replace(/^\s*;\s*$/gm, '');

  // 4. إزالة backticks
  cleaned = cleaned.replace(/`/g, '');

  // 5. إزالة الأسطر الفارغة المتكررة
  cleaned = cleaned.replace(/[ \t]+\n/g, '\n');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

/**
 * يزيل أي إشارة إلى جذور أخرى
 */
function removeOtherRootsReferences(text, currentRoot) {
  if (!text) return '';

  const lines = text.split('\n');
  const filtered = [];
  let skipBlock = false;
  let braceDepth = 0;

  for (const line of lines) {
    // كشف بداية كتلة JSON
    if (/^\s*\{/.test(line)) {
      braceDepth += (line.match(/\{/g) || []).length;
      skipBlock = true;
      continue;
    }
    if (skipBlock) {
      braceDepth += (line.match(/\{/g) || []).length;
      braceDepth -= (line.match(/\}/g) || []).length;
      if (braceDepth <= 0) {
        skipBlock = false;
        braceDepth = 0;
      }
      continue;
    }

    // تخطي أسطر تشير لجذور أخرى
    const rootRef = line.match(/^الجذر\s+(\d+)\s*[–—\-]/);
    if (rootRef && parseInt(rootRef[1], 10) !== currentRoot) {
      continue;
    }

    // تخطي أسطر "3) جدول الجذور الموسعة"
    if (/^\d+\)\s*جدول الجذور الموسعة/.test(line)) continue;

    filtered.push(line);
  }

  return filtered.join('\n');
}

// ────────────────────────────────────────────────
// 3. معالجة كل جذر
// ────────────────────────────────────────────────
console.log('🔧 معالجة الجذور:\n');

const cleanedRoots = raw.roots.map(root => {
  const rootNum = root.number;
  const originalText = root.reference_text || '';

  // استخراج القسم A
  let sectionA = extractSection(originalText, 'A');
  // استخراج القسم C
  let sectionC = extractSection(originalText, 'C');

  // تنظيف
  sectionA = cleanSection(sectionA);
  sectionC = cleanSection(sectionC);

  // إزالة إشارات الجذور الأخرى
  sectionA = removeOtherRootsReferences(sectionA, rootNum);
  sectionC = removeOtherRootsReferences(sectionC, rootNum);

  // العنوان النظيف
  const cleanTitle = extractCleanTitle(originalText) || root.title;

  // النص النهائي المُنقّح
  const cleanText = [
    `# الجذر ${rootNum} — ${cleanTitle}`,
    '',
    sectionA,
    '',
    sectionC,
  ].filter(Boolean).join('\n\n');

  console.log(`   ✓ ROOT_${rootNum}: ${cleanText.length} حرف (كان ${originalText.length}) — نسبة الاختزال: ${Math.round((1 - cleanText.length / originalText.length) * 100)}%`);

  return {
    id: root.id,
    number: root.number,
    title: root.title,
    clean_title: cleanTitle,
    reference_text: cleanText,
    operational: root.operational,
  };
});

// ────────────────────────────────────────────────
// 4. بناء JSON نظيف
// ────────────────────────────────────────────────
const cleanOutput = {
  schema_version: raw.schema_version + '-clean',
  title: raw.title,
  type: raw.type,
  cleaned_at: new Date().toISOString(),
  cleaning_stats: {
    original_size_kb: Math.round(fs.statSync(INPUT).size / 1024),
    roots_processed: cleanedRoots.length,
    rule: 'استخراج الأقسام A و C فقط — حذف كل الإشارات للجذور الأخرى والمخلفات التقنية',
  },
  letters: raw.letters || [],
  roots: cleanedRoots,
  resonance_pairs_36: raw.resonance_pairs_36 || [],
  remedy_map: raw.remedy_map || {},
  formulas: raw.formulas || {},
  inference_rules: raw.inference_rules || [],
  confidence_scale: raw.confidence_scale || [],
  layer_order: raw.layer_order || [],
};

// ────────────────────────────────────────────────
// 5. كتابة الملف النظيف
// ────────────────────────────────────────────────
fs.writeFileSync(OUTPUT, JSON.stringify(cleanOutput, null, 2), 'utf-8');

const outputSize = fs.statSync(OUTPUT).size;
console.log(`\n✅ تم إنشاء: ${OUTPUT}`);
console.log(`   الحجم الجديد: ${Math.round(outputSize / 1024)} KB`);
console.log(`   الحجم الأصلي: ${cleanOutput.cleaning_stats.original_size_kb} KB`);
console.log(`   نسبة الاختزال: ${Math.round((1 - outputSize / (cleanOutput.cleaning_stats.original_size_kb * 1024)) * 100)}%`);
console.log('\n═══════════════════════════════════════════════════════════');
console.log('   ✨ الموسوعة النظيفة جاهزة للاستخدام');
console.log('═══════════════════════════════════════════════════════════');
