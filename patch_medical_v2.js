const fs = require('fs');

function patchFile(filePath, varName) {
  console.log('\n🔧 تعديل:', filePath);
  if (!fs.existsSync(filePath)) {
    console.error('❌ الملف غير موجود');
    return;
  }

  // نسخة احتياطية
  fs.copyFileSync(filePath, filePath + '.backup-v2-' + Date.now());

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. إضافة الاستيراد إذا لم يكن موجوداً
  if (!content.includes("from '../data/medicalLookup'")) {
    const lastImportIdx = content.lastIndexOf("import ");
    const lineEnd = content.indexOf("\n", lastImportIdx);
    content = content.slice(0, lineEnd + 1)
      + "import { buildMedicalSection } from '../data/medicalLookup';\n"
      + content.slice(lineEnd + 1);
    console.log('  ➕ إضافة الاستيراد');
  }

  // 2. البحث عن موقع `return {` في نهاية دالة buildReport
  // نريد آخر `return {` قبل نهاية الملف (return الكائن الرئيسي)
  const returnMatches = [...content.matchAll(/\n\s*return\s*\{/g)];
  
  if (returnMatches.length === 0) {
    console.error('  ❌ لم يُعثر على return');
    return;
  }

  // آخر return { في الملف
  const lastReturn = returnMatches[returnMatches.length - 1];
  const insertPos = lastReturn.index;

  // 3. نبحث قبل return عن آخر تعريف لـ `const ${varName}`
  // لتأكيد أننا بعد بناء النص
  const beforeReturn = content.slice(0, insertPos);
  const varPattern = new RegExp(`const\\s+${varName}\\s*=`, 'g');
  const varMatches = [...beforeReturn.matchAll(varPattern)];

  if (varMatches.length === 0) {
    console.error(`  ❌ لم يُعثر على const ${varName} قبل return`);
    return;
  }

  // 4. بناء كود الإدراج - يستخدم ${varName} المتغير الموجود
  const medicalCode = `
  // ═══ إضافة القسم الطبي تلقائياً ═══
  const medicalSection = buildMedicalSection(root, root);
  if (medicalSection) {
    const medicalHeader = '\\n\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n【 الموسوعة الطبية الكاملة للجذر ' + root + ' 】\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n';
    ${varName} = ${varName} + medicalHeader + medicalSection;
  }
`;

  // 5. تعديل الكود لاستخدام let بدلاً من const للنص الرئيسي
  // نبحث عن `const ${varName} = ` ونستبدلها بـ `let ${varName} = `
  content = content.replace(
    new RegExp(`(\\n\\s*)const\\s+(${varName})\\s*=`, 'g'),
    `$1let $2 =`
  );
  console.log(`  🔄 تحويل const ${varName} إلى let ${varName}`);

  // 6. إعادة حساب موقع الإدراج (تغير حجم الملف قليلاً)
  const newReturnMatches = [...content.matchAll(/\n\s*return\s*\{/g)];
  const newInsertPos = newReturnMatches[newReturnMatches.length - 1].index;

  // 7. إدراج كود القسم الطبي
  content = content.slice(0, newInsertPos) + medicalCode + content.slice(newInsertPos);
  console.log('  ➕ إدراج كود القسم الطبي');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('  ✅ تم');
}

// معالجة الملفات
patchFile('src/engine/reportBuilder.ts', 'fullReport');
patchFile('src/engine/structuredReportBuilder.ts', 'fullText');

console.log('\n🎉 اكتمل التعديل');
