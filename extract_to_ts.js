const fs = require('fs');
const path = require('path');

const inputFile = path.join(process.env.HOME, 'storage', 'downloads', 'Master .txt');
if (!fs.existsSync(inputFile)) {
  console.error('❌ ملف Master .txt غير موجود في المسار المحدد.');
  process.exit(1);
}

const content = fs.readFileSync(inputFile, 'utf8');
const sections = [];
const lines = content.split(/\r?\n/);
let currentSection = { title: 'Preamble', lines: [] };

for (const line of lines) {
  if (/^───+/.test(line.trim())) {
    if (currentSection.lines.length > 0) sections.push(currentSection);
    currentSection = { title: 'فاصل', lines: [] };
  } else if (/^(القسم|Section)\s/.test(line.trim())) {
    if (currentSection.lines.length > 0) sections.push(currentSection);
    currentSection = { title: line.trim(), lines: [] };
  } else {
    currentSection.lines.push(line);
  }
}
if (currentSection.lines.length > 0) sections.push(currentSection);

function extractByTitle(titlePart, names) {
  const section = sections.find(s => s.title.includes(titlePart));
  if (!section) return {};
  const text = section.lines.join('\n');
  const result = {};
  for (const name of names) {
    const idx = text.indexOf(name + ':');
    if (idx !== -1) {
      const end = text.indexOf('\n\n', idx + name.length + 1);
      const body = text.slice(idx, end === -1 ? undefined : end).trim();
      result[name] = body;
    }
  }
  return result;
}

// استخراج الجذور
const rootsSection = sections.find(s => s.title.includes('الجذور السيادية التسعة'));
if (rootsSection) {
  const rootText = rootsSection.lines.join('\n');
  const rootMatches = [...rootText.matchAll(/الجذر (الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع):[^\n]*/g)];
  const roots = {};
  for (let i = 0; i < rootMatches.length; i++) {
    const start = rootMatches[i].index;
    const end = i + 1 < rootMatches.length ? rootMatches[i+1].index : rootText.length;
    roots[i+1] = rootText.slice(start, end).trim();
  }
  fs.writeFileSync('src/data/roots.ts', `export const ROOTS_FULL_TEXT: Record<number, string> = ${JSON.stringify(roots, null, 2)};`);
  console.log('✅ roots.ts');
}

// استخراج الكواكب
const planets = extractByTitle('الكواكب العشرة', ['الشمس','القمر','عطارد','الزهرة','المريخ','المشتري','زحل','أورانوس','نبتون','بلوتو']);
fs.writeFileSync('src/data/planets.ts', `export const PLANETS_FULL_TEXT: Record<string, string> = ${JSON.stringify(planets, null, 2)};`);
console.log('✅ planets.ts');

// استخراج الأبراج
const signs = extractByTitle('الأبراج الاثنا عشر', ['الحمل','الثور','الجوزاء','السرطان','الأسد','العذراء','الميزان','العقرب','القوس','الجدي','الدلو','الحوت']);
fs.writeFileSync('src/data/signs.ts', `export const SIGNS_FULL_TEXT: Record<string, string> = ${JSON.stringify(signs, null, 2)};`);
console.log('✅ signs.ts');

// استخراج الطبائع
const elements = extractByTitle('الطبائع الأربع', ['نار','تراب','هواء','ماء']);
fs.writeFileSync('src/data/elements.ts', `export const ELEMENTS_FULL_TEXT: Record<string, string> = ${JSON.stringify(elements, null, 2)};`);
console.log('✅ elements.ts');

// استخراج البيوت
const housesSection = sections.find(s => s.title.includes('البيوت الاثنا عشر'));
if (housesSection) {
  const houseText = housesSection.lines.join('\n');
  const houses = {};
  for (let i = 1; i <= 12; i++) {
    const idx = houseText.indexOf(`البيت ${i}:`);
    if (idx === -1) continue;
    const end = houseText.indexOf('\n\n', idx + 1);
    houses[i] = houseText.slice(idx, end === -1 ? undefined : end).trim();
  }
  fs.writeFileSync('src/data/houses.ts', `export const HOUSES_FULL_TEXT: Record<number, string> = ${JSON.stringify(houses, null, 2)};`);
  console.log('✅ houses.ts');
}

console.log('🎉 تم استخراج النصوص الكاملة');
