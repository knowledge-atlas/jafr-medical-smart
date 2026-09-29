const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// أدوات مساعدة
// ═══════════════════════════════════════════════════════════════

function backup(filePath) {
  const backupPath = filePath + '.backup-' + Date.now();
  fs.copyFileSync(filePath, backupPath);
  console.log('📦 نسخة احتياطية:', path.basename(backupPath));
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✏️  تم تعديل:', path.basename(filePath));
}

// ═══════════════════════════════════════════════════════════════
// تعديل reportBuilder.ts
// ═══════════════════════════════════════════════════════════════

function patchReportBuilder() {
  const filePath = 'src/engine/reportBuilder.ts';
  if (!fs.existsSync(filePath)) {
    console.error('❌ الملف غير موجود:', filePath);
    return;
  }

  backup(filePath);
  let content = readFile(filePath);

  // 1. إضافة استيراد buildMedicalSection إذا لم يكن موجوداً
  if (!content.includes("from '../data/medicalLookup'")) {
    // أضف بعد آخر استيراد
    const lastImportMatch = content.match(/(import[^\n]+\n)(?!.*import)/s);
    if (lastImportMatch) {
      const idx = content.lastIndexOf("import ");
      const lineEnd = content.indexOf("\n", idx);
      content = content.slice(0, lineEnd + 1)
        + "import { buildMedicalSection } from '../data/medicalLookup';\n"
        + content.slice(lineEnd + 1);
    } else {
      content = "import { buildMedicalSection } from '../data/medicalLookup';\n" + content;
    }
    console.log('➕ إضافة استيراد buildMedicalSection إلى reportBuilder');
  }

  // 2. إضافة كود إدراج القسم الطبي قبل return
  if (!content.includes('medicalSection')) {
    // ابحث عن أول return في دالة buildReport
    const returnPattern = /(\n\s*return\s*\{)/;
    const returnMatch = content.match(returnPattern);
    
    if (returnMatch) {
      const insertPosition = content.indexOf(returnMatch[0]);
      const medicalCode = `
  // ═══ القسم الطبي التلقائي ═══
  const medicalSection = buildMedicalSection(root, root);
  if (medicalSection) {
    const medicalHeader = '\\n\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n【 الموسوعة الطبية الكاملة للجذر ' + root + ' 】\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n';
    if (typeof fullReport === 'string') {
      fullReport = fullReport + medicalHeader + medicalSection;
    }
    if (typeof fullText === 'string') {
      fullText = fullText + medicalHeader + medicalSection;
    }
  }
`;
      content = content.slice(0, insertPosition) + medicalCode + content.slice(insertPosition);
      console.log('➕ إضافة كود القسم الطبي إلى reportBuilder');
    } else {
      console.warn('⚠️  لم يتم العثور على return في reportBuilder');
    }
  }

  writeFile(filePath, content);
}

// ═══════════════════════════════════════════════════════════════
// تعديل structuredReportBuilder.ts
// ═══════════════════════════════════════════════════════════════

function patchStructuredReportBuilder() {
  const filePath = 'src/engine/structuredReportBuilder.ts';
  if (!fs.existsSync(filePath)) {
    console.error('❌ الملف غير موجود:', filePath);
    return;
  }

  backup(filePath);
  let content = readFile(filePath);

  // 1. إضافة استيراد buildMedicalSection
  if (!content.includes("from '../data/medicalLookup'")) {
    const idx = content.lastIndexOf("import ");
    const lineEnd = content.indexOf("\n", idx);
    content = content.slice(0, lineEnd + 1)
      + "import { buildMedicalSection } from '../data/medicalLookup';\n"
      + content.slice(lineEnd + 1);
    console.log('➕ إضافة استيراد buildMedicalSection إلى structuredReportBuilder');
  }

  // 2. إضافة كود القسم الطبي
  if (!content.includes('buildMedicalSection(root')) {
    const returnPattern = /(\n\s*return\s+)/;
    const returnMatch = content.match(returnPattern);
    
    if (returnMatch) {
      const insertPosition = content.indexOf(returnMatch[0]);
      const medicalCode = `
  // ═══ القسم الطبي التلقائي ═══
  const medicalSection = buildMedicalSection(root, root);
  if (medicalSection && typeof fullText === 'string') {
    fullText += '\\n\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n【 الموسوعة الطبية الكاملة للجذر ' + root + ' 】\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n' + medicalSection;
  }
`;
      content = content.slice(0, insertPosition) + medicalCode + content.slice(insertPosition);
      console.log('➕ إضافة كود القسم الطبي إلى structuredReportBuilder');
    } else {
      console.warn('⚠️  لم يتم العثور على return في structuredReportBuilder');
    }
  }

  writeFile(filePath, content);
}

// ═══════════════════════════════════════════════════════════════
// تنفيذ
// ═══════════════════════════════════════════════════════════════

console.log('🔧 بدء تعديل الملفات...\n');
patchReportBuilder();
console.log('');
patchStructuredReportBuilder();
console.log('\n✅ اكتمل التعديل. الملفات الاحتياطية محفوظة بجانب الأصلية.');
