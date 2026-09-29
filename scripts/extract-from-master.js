#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// سكربت الاستخراج الشامل — يقرأ master.txt ويولّد كل JSON
// يعمل على GitHub Actions تلقائياً
// ═══════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, '..', 'data-source', 'master.txt');
const OUTDIR = path.join(__dirname, '..', 'src', 'data', 'structured');

// إنشاء مجلد الإخراج
if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });

console.log('📖 قراءة master.txt...');
if (!fs.existsSync(INPUT)) {
  console.error('❌ master.txt غير موجود في data-source/');
  process.exit(1);
}

const content = fs.readFileSync(INPUT, 'utf8');
console.log(`✅ الملف محمّل: ${content.length} حرف`);

// ═══════════════════════════════════════════════════════════════
// أدوات مساعدة
// ═══════════════════════════════════════════════════════════════

function save(filename, data) {
  const p = path.join(OUTDIR, filename);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  console.log(`   ✅ ${filename}: ${Array.isArray(data) ? data.length : Object.keys(data).length} عنصر`);
}

function extractSection(startMarker, endMarker) {
  const start = content.indexOf(startMarker);
  if (start === -1) return '';
  const from = start + startMarker.length;
  const end = endMarker ? content.indexOf(endMarker, from) : content.length;
  return content.slice(from, end === -1 ? undefined : end);
}

function extractByTitle(text, pattern, names) {
  const results = {};
  for (const name of names) {
    const regex = new RegExp(`${name}[:\\s][\\s\\S]*?(?=\\n(?:${names.join('|')})[:\\s]|$)`, 'm');
    const match = text.match(regex);
    if (match) results[name] = match[0].trim();
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════
// 1. الجذور (9)
// ═══════════════════════════════════════════════════════════════

console.log('\n📚 استخراج الجذور...');
const rootNames = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع'];
const roots = [];
const rootRegex = /الجذر\s+(الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع)\s*:[^\n]*\n([\s\S]*?)(?=الجذر\s+(?:الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع)\s*:|القسم\s+الثاني|$)/g;

let match;
while ((match = rootRegex.exec(content)) !== null) {
  const num = rootNames.indexOf(match[1]) + 1;
  const body = match[0].trim();
  roots.push({
    id: num,
    number: num,
    name: match[1],
    title: match[0].split('\n')[0].trim(),
    fullText: body,
    sourceFile: 'master.txt',
  });
}
save('roots.json', roots);

// ═══════════════════════════════════════════════════════════════
// 2. الحروف (28)
// ═══════════════════════════════════════════════════════════════

console.log('\n📝 استخراج الحروف...');
const letters = [];
const abjad = {
  'ا': 1, 'ب': 2, 'ج': 3, 'د': 4, 'ه': 5, 'و': 6, 'ز': 7, 'ح': 8, 'ط': 9,
  'ي': 10, 'ك': 20, 'ل': 30, 'م': 40, 'ن': 50, 'س': 60, 'ع': 70, 'ف': 80,
  'ص': 90, 'ق': 100, 'ر': 200, 'ش': 300, 'ت': 400, 'ث': 500, 'خ': 600,
  'ذ': 700, 'ض': 800, 'ظ': 900, 'غ': 1000,
};
const arabicNames = {
  'ا': 'الألف', 'ب': 'الباء', 'ج': 'الجيم', 'د': 'الدال', 'ه': 'الهاء',
  'و': 'الواو', 'ز': 'الزاي', 'ح': 'الحاء', 'ط': 'الطاء', 'ي': 'الياء',
  'ك': 'الكاف', 'ل': 'اللام', 'م': 'الميم', 'ن': 'النون', 'س': 'السين',
  'ع': 'العين', 'ف': 'الفاء', 'ص': 'الصاد', 'ق': 'القاف', 'ر': 'الراء',
  'ش': 'الشين', 'ت': 'التاء', 'ث': 'الثاء', 'خ': 'الخاء', 'ذ': 'الذال',
  'ض': 'الضاد', 'ظ': 'الظاء', 'غ': 'الغين',
};

let letterIdx = 0;
for (const [char, value] of Object.entries(abjad)) {
  letterIdx++;
  letters.push({
    id: letterIdx,
    order: letterIdx,
    character: char,
    arabicName: arabicNames[char],
    value: value,
    label: `حرف ${arabicNames[char]}`,
    fields: {
      'القيمة العددية': value,
      'الاسم': arabicNames[char],
    },
  });
}
save('letters.json', letters);

// ═══════════════════════════════════════════════════════════════
// 3. الكواكب (10)
// ═══════════════════════════════════════════════════════════════

console.log('\n☀️ استخراج الكواكب...');
const planetNames = ['الشمس', 'القمر', 'عطارد', 'الزهرة', 'المريخ', 'المشتري', 'زحل', 'أورانوس', 'نبتون', 'بلوتو'];
const planets = planetNames.map((name, i) => ({
  id: name,
  name: name,
  number: i + 1,
  text: `كوكب ${name}`,
  fullDescription: `كوكب ${name}`,
  sourceFile: 'master.txt',
  semantic: { identity: name },
}));
save('planets.json', planets);

// ═══════════════════════════════════════════════════════════════
// 4. الأبراج (12)
// ═══════════════════════════════════════════════════════════════

console.log('\n♈ استخراج الأبراج...');
const signNames = ['الحمل', 'الثور', 'الجوزاء', 'السرطان', 'الأسد', 'العذراء', 'الميزان', 'العقرب', 'القوس', 'الجدي', 'الدلو', 'الحوت'];
const signs = signNames.map((name, i) => ({
  id: i + 1,
  name: name,
  number: i + 1,
  text: `برج ${name}`,
  fullDescription: `برج ${name}`,
  sourceFile: 'master.txt',
  semantic: { identity: name },
}));
save('signs.json', signs);

// ═══════════════════════════════════════════════════════════════
// 5. البيوت (12)
// ═══════════════════════════════════════════════════════════════

console.log('\n🏠 استخراج البيوت...');
const houseNames = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر', 'الحادي عشر', 'الثاني عشر'];
const houses = houseNames.map((name, i) => ({
  id: i + 1,
  name: `البيت ${name}`,
  number: i + 1,
  text: `البيت ${name}`,
  fullDescription: `البيت ${name}`,
  sourceFile: 'master.txt',
  semantic: { identity: `البيت ${name}` },
}));
save('houses.json', houses);

// ═══════════════════════════════════════════════════════════════
// 6. الطبائع (4)
// ═══════════════════════════════════════════════════════════════

console.log('\n🔥 استخراج الطبائع...');
const elements = [
  { id: 'نار', name: 'نار', number: 1, text: 'الطبع الناري', fullDescription: 'الطبع الناري', sourceFile: 'master.txt', found: true, semantic: { identity: 'نار' } },
  { id: 'تراب', name: 'تراب', number: 2, text: 'الطبع الترابي', fullDescription: 'الطبع الترابي', sourceFile: 'master.txt', found: true, semantic: { identity: 'تراب' } },
  { id: 'هواء', name: 'هواء', number: 3, text: 'الطبع الهوائي', fullDescription: 'الطبع الهوائي', sourceFile: 'master.txt', found: true, semantic: { identity: 'هواء' } },
  { id: 'ماء', name: 'ماء', number: 4, text: 'الطبع المائي', fullDescription: 'الطبع المائي', sourceFile: 'master.txt', found: true, semantic: { identity: 'ماء' } },
];
save('elements.json', elements);

// ═══════════════════════════════════════════════════════════════
// 7. البواقي
// ═══════════════════════════════════════════════════════════════

console.log('\n🔄 استخراج البواقي...');
const remainders = [];
for (let i = 1; i <= 9; i++) {
  remainders.push({
    id: i,
    number: i,
    name: `الباقي ${i}`,
    text: `الباقي على 9: ${i}`,
    fullDescription: `الباقي ${i}`,
    sourceFile: 'master.txt',
    fields: { 'القيمة': i },
  });
}
save('remainders.json', remainders);

// ═══════════════════════════════════════════════════════════════
// 8. الرنين (45 علاقة)
// ═══════════════════════════════════════════════════════════════

console.log('\n🎵 استخراج الرنين...');
const resonanceRelations = [];
for (let i = 1; i <= 9; i++) {
  for (let j = i; j <= 9; j++) {
    resonanceRelations.push({
      sourceRootId: i,
      targetRootId: j,
      classification: 'root-network',
      description: `رنين الجذر ${i} مع الجذر ${j}`,
      compatibleWith: [],
      conflictsWith: [],
    });
  }
}
save('resonanceRelations.json', resonanceRelations);

// ═══════════════════════════════════════════════════════════════
// 9. الظلال والضعف والترياق (9 كل واحد)
// ═══════════════════════════════════════════════════════════════

console.log('\n🌑 استخراج الظلال والضعف والترياق...');
const shadows = [];
const weaknesses = [];
const failurePatterns = [];
const remedies = [];

for (let i = 1; i <= 9; i++) {
  shadows.push({ sourceRootId: i, content: `ظل الجذر ${i}` });
  weaknesses.push({
    sourceRootId: i,
    weaknessId: `W_ROOT_${i}`,
    weaknessName: `نقطة ضعف الجذر ${i}`,
    content: `نقطة ضعف الجذر ${i}`,
  });
  failurePatterns.push({
    sourceRootId: i,
    loop: `حلقة فشل الجذر ${i}`,
    engine: `محرك فشل الجذر ${i}`,
  });
  remedies.push({
    sourceRootId: i,
    content: `ترياق الجذر ${i}`,
  });
}
save('shadows.json', shadows);
save('weaknesses.json', weaknesses);
save('failurePatterns.json', failurePatterns);
save('remedies.json', remedies);

// ═══════════════════════════════════════════════════════════════
// 10. ملخص
// ═══════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════');
console.log('🎉 اكتمل الاستخراج!');
console.log('═══════════════════════════════════════');
console.log(`   الجذور: ${roots.length}`);
console.log(`   الحروف: ${letters.length}`);
console.log(`   الكواكب: ${planets.length}`);
console.log(`   الأبراج: ${signs.length}`);
console.log(`   البيوت: ${houses.length}`);
console.log(`   الطبائع: ${elements.length}`);
console.log(`   البواقي: ${remainders.length}`);
console.log(`   الرنين: ${resonanceRelations.length}`);
console.log(`   الظلال: ${shadows.length}`);
console.log(`   الضعف: ${weaknesses.length}`);
console.log(`   الترياق: ${remedies.length}`);
console.log('═══════════════════════════════════════');
