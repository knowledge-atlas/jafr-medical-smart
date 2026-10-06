#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// stats.mjs — يولّد project-stats.json من المصدر
// ═══════════════════════════════════════════════════════════
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function sh(cmd) {
  try { return execSync(cmd, { cwd: ROOT, encoding: 'utf-8' }).trim(); }
  catch { return ''; }
}

function countFiles(pattern, inDir = null) {
  const base = inDir ? `./${inDir}` : '.';
  const cmd = `find ${base} -type f -name "${pattern}" -not -path "*/node_modules/*" 2>/dev/null | wc -l`;
  return parseInt(sh(cmd) || '0', 10);
}

function countDirs(pattern) {
  const cmd = `find . -type d -name "${pattern}" -not -path "./node_modules/*" 2>/dev/null | wc -l`;
  return parseInt(sh(cmd) || '0', 10);
}

function linesOfCode() {
  const cmd = `find src -type f \\( -name "*.ts" -o -name "*.tsx" \\) -not -path "*/node_modules/*" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}'`;
  return parseInt(sh(cmd) || '0', 10);
}

function lastCommit() {
  return {
    hash: sh('git rev-parse --short HEAD'),
    message: sh('git log -1 --pretty=%s'),
    date: sh('git log -1 --pretty=%cI'),
  };
}

// اقرأ package.json
let pkg = { version: '0.0.0', name: 'unknown' };
try {
  pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
} catch {}

// احسب عدد الاختبارات من مخرَج vitest آخر — بديل: نقرأه من ملف
let tests = { total: 0, passed: 0, failed: 0, skipped: 0 };
try {
  const cached = fs.readFileSync(path.join(ROOT, '.vitest-result.json'), 'utf-8');
  tests = JSON.parse(cached);
} catch {}

// ═══ ابنِ الإحصائيات ═══
const stats = {
  generatedAt: new Date().toISOString(),
  version: pkg.version,
  name: pkg.name,

  counts: {
    screens: countFiles('*Screen.tsx', 'src/screens'),
    components: countFiles('*.tsx', 'src/components'),
    engines: countFiles('*.ts', 'src/domain/services'),
    products: countFiles('*.ts', 'src/products'),
    aiFiles: countFiles('*.ts', 'src/ai'),
    dataFiles: countFiles('*.ts', 'src/data') + countFiles('*.json', 'src/data'),
    tests: countFiles('*.test.ts', 'src') + countFiles('*.test.ts', 'tests'),
    testSuites: countDirs('__tests__'),
  },

  size: {
    linesOfCode: linesOfCode(),
    srcFiles: parseInt(sh('find src -type f -not -path "*/node_modules/*" | wc -l') || '0', 10),
  },

  tests,

  lastCommit: lastCommit(),

  // اقرأ KB entities count إن وُجد
  knowledge: (() => {
    try {
      const kbPath = path.join(ROOT, 'src/data/external/entities.json');
      const data = JSON.parse(fs.readFileSync(kbPath, 'utf-8'));
      return {
        externalEntities: data.total ?? data.entities?.length ?? 0,
        externalByType: data.byType ?? {},
        generatedAt: data.generatedAt ?? null,
      };
    } catch {
      return { externalEntities: 0, externalByType: {} };
    }
  })(),
};

fs.writeFileSync(
  path.join(ROOT, 'project-stats.json'),
  JSON.stringify(stats, null, 2),
  'utf-8'
);

console.log('✅ project-stats.json مُولَّد');
console.log(`   الإصدار: ${stats.version}`);
console.log(`   الشاشات: ${stats.counts.screens}`);
console.log(`   المكوّنات: ${stats.counts.components}`);
console.log(`   الملفات: ${stats.size.srcFiles}`);
console.log(`   الأسطر: ${stats.size.linesOfCode}`);
console.log(`   كيانات خارجية: ${stats.knowledge.externalEntities}`);
console.log(`   آخر commit: ${stats.lastCommit.hash} — ${stats.lastCommit.message}`);
