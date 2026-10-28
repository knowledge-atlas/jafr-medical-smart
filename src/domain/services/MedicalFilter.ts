// ================================================================
// STUB — No-op filter للتوافق البرمجي
// سبب الحذف: امتثال Google Play (لا محتوى طبي)
// الوظيفة: تمرير النص كما هو (لا تصفية، لا بيانات)
// ================================================================

export class MedicalFilter {
  static filter(text: string): string { return text; }
  static isMedical(_text: string): boolean { return false; }
  static apply(text: string): string { return text; }
}

export const filterMedical = (text: string): string => text;
export const filterMedicalContent = (text: string): string => text;
export const isMedical = (_text: string): boolean => false;

export default MedicalFilter;
