// ═══════════════════════════════════════════════════════════
// جدول الأبجد — يدعم كل أشكال الهمزة والحركات
// ═══════════════════════════════════════════════════════════

export const abjadMap: Record<string, number> = (() => {
  const letters = "ابجد هوز حطي كلمن سعفص قرشت ثخذ ضظغ".replace(/\s/g, '');
  const values = [1,2,3,4,5,6,7,8,9,10,20,30,40,50,60,70,80,90,100,200,300,400,500,600,700,800,900,1000];
  const map: Record<string, number> = {};
  for (let i = 0; i < letters.length; i++) {
    map[letters[i]] = values[i];
  }

  // ═══ أشكال الألف (كلها = 1) ═══
  map['أ'] = 1;   // ألف بهمزة فوق
  map['إ'] = 1;   // ألف بهمزة تحت
  map['آ'] = 1;   // ألف بمدة
  map['ٱ'] = 1;   // ألف وصل
  map['ٲ'] = 1;
  map['ٳ'] = 1;
  map['ء'] = 1;   // همزة مستقلة (بعض المدارس تعطيها 1)
  map['ﭐ'] = 1;

  // ═══ الواو بأشكالها (= 6) ═══
  map['ؤ'] = 6;   // واو بهمزة
  map['و'] = 6;   // (موجودة أصلاً لكن للأمان)

  // ═══ الياء بأشكالها (= 10) ═══
  map['ئ'] = 10;  // ياء بهمزة
  map['ى'] = 10;  // ألف مقصورة
  map['ي'] = 10;  // (موجودة أصلاً)
  map['ﻯ'] = 10;
  map['ﻰ'] = 10;

  // ═══ التاء المربوطة (= 5) ═══
  map['ة'] = 5;

  // ═══ الهمزة على السطر — بعض المدارس تعطيها قيمة 1 ═══
  // (مغطاة في map['ء'])

  return map;
})();

// ═══════════════════════════════════════════════════════════
// stripDiacritics — إزالة الحركات والتشكيل قبل الحساب
// ═══════════════════════════════════════════════════════════
export function stripDiacritics(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u0652]/g, '') // فتحة ضمة كسرة سكون شدة تنوين
    .replace(/[\u0670]/g, '')         // ألف خنجرية
    .replace(/[\u06D6-\u06ED]/g, '')  // علامات تجويد
    .replace(/\u0640/g, '');          // تطويل (كشيدة)
}

// ═══════════════════════════════════════════════════════════
// extractLetters — يستخرج الحروف القابلة للحساب
// ═══════════════════════════════════════════════════════════
export const extractLetters = (name: string): string[] => {
  const cleaned = stripDiacritics(name);
  return cleaned.split('').filter((c) => abjadMap[c] !== undefined);
};

// ═══════════════════════════════════════════════════════════
// calculateAbjad
// ═══════════════════════════════════════════════════════════
export const calculateAbjad = (name: string) => {
  const letters = extractLetters(name);
  const values = letters.map((l) => abjadMap[l]);
  const total = values.reduce((sum, v) => sum + v, 0);
  const digitalRoot = total > 0 ? 1 + (total - 1) % 9 : 0;
  return { letters, values, total, digitalRoot };
};
