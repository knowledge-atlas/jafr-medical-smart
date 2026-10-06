import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, 'sources.custom.json');

const TYPES = ['root','planet','sign','house','element','letter','remainder','compound','resonance','medical','remedy','wafq'];
const LENSES = [
  { id: 'general', label: 'عام' },
  { id: 'falaki',  label: 'فلكي' },
  { id: 'ramzi',   label: 'رمزي' },
  { id: 'lughawi', label: 'لغوي' },
  { id: 'tarikhi', label: 'تاريخي' },
  { id: 'custom',  label: 'مخصص' },
];

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('\n══════════════════════════════════════════');
  console.log('📚 إضافة مصدر معرفي مخصص');
  console.log('══════════════════════════════════════════\n');

  const raw = await fs.readFile(FILE, 'utf-8');
  const data = JSON.parse(raw);
  const list = data.sources ?? [];

  console.log(`📊 المصادر الحالية: ${list.length}\n`);

  const id = (await rl.question('🆔 معرّف المصدر (بالإنجليزية): ')).trim() || `source_${Date.now()}`;

  console.log('\n📋 نوع المصدر:');
  console.log('  1) wikipedia');
  console.log('  2) json');
  console.log('  3) local');
  const t = (await rl.question('اختر (1-3): ')).trim();
  const type = t === '2' ? 'json' : t === '3' ? 'local' : 'wikipedia';

  const source = { id, type, enabled: true };

  if (type === 'wikipedia') {
    const searchTerm = (await rl.question('\n🔍 كلمة البحث: ')).trim();
    const titleAr = (await rl.question('📝 العنوان: ')).trim() || searchTerm;
    console.log(`\n🏷️ الأنواع: ${TYPES.join(', ')}`);
    const entityType = ((await rl.question('النوع: ')).trim()) || 'medical';
    console.log(`\n🔭 العدسات: ${LENSES.map(l => l.id).join(', ')}`);
    const l = ((await rl.question('العدسة: ')).trim()) || 'custom';
    const lensMeta = LENSES.find(x => x.id === l) ?? { id: 'custom', label: 'مخصص' };
    const kwRaw = (await rl.question('\n🔑 كلمات مفتاحية (بفواصل): ')).trim();
    const keywords = kwRaw ? kwRaw.split(/[,،]/).map(k => k.trim()).filter(Boolean) : [];
    source.description = titleAr;
    source.queries = [{ entityType, titleAr, searchTerm, lens: lensMeta.id, lensLabel: lensMeta.label, keywords }];
  } else if (type === 'json') {
    source.url = (await rl.question('\n🔗 رابط JSON: ')).trim();
    source.description = (await rl.question('📝 وصف: ')).trim() || 'JSON source';
  } else {
    source.path = (await rl.question('\n📁 مسار الملف: ')).trim();
    source.description = (await rl.question('📝 وصف: ')).trim() || 'Local source';
  }

  list.push(source);
  data.sources = list;

  await fs.writeFile(FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n✅ تم إضافة: ${id}`);
  console.log(`📊 الإجمالي: ${list.length} مصدر`);
  console.log('\n▶️ للتشغيل: node tools/knowledge-sync/run.mjs\n');
  rl.close();
}

main().catch(e => { console.error('❌', e); process.exit(1); });
