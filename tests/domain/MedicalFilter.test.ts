import { describe, it, expect } from 'vitest';
import { MedicalFilter, medicalFilter } from '../../src/domain/services/MedicalFilter';

describe('MedicalFilter — حجب الادعاءات الطبية', () => {
  const filter = new MedicalFilter();

  it('نص طبي نظيف بدون جرعات → لا تغيير', () => {
    const input = 'المكمل: 5-HTP، أوميغا 3. الرياضة: سباحة.';
    const result = filter.filter(input);
    expect(result.text).toContain('5-HTP');
    expect(result.removedItems.length).toBe(0);
  });

  it('جرعة دوائية (نطاق) → محجوبة', () => {
    const input = 'الجرعة: سيرترالين 50-200 mg يومياً.';
    const result = filter.filter(input);
    expect(result.text).not.toContain('50-200 mg');
    expect(result.applied).toBe(true);
  });

  it('جرعة دوائية (مفردة) → محجوبة', () => {
    const input = 'الجرعة: 20 mg يومياً.';
    const result = filter.filter(input);
    expect(result.text).not.toContain('20 mg');
  });

  it('اسم فئة دوائية SSRIs → محجوب', () => {
    const input = 'الدواء الأساسي: SSRIs (Sertraline, Escitalopram).';
    const result = filter.filter(input);
    expect(result.text).not.toContain('Sertraline');
  });

  it('اسم دواء كيميائي → محجوب', () => {
    const input = 'يوصف Sertraline أو Fluoxetine للمرضى.';
    const result = filter.filter(input);
    expect(result.text).not.toContain('Sertraline');
    expect(result.text).not.toContain('Fluoxetine');
  });

  it('اسم دواء بالعربية → محجوب', () => {
    const input = 'العلاج يشمل سيرترالين وإسيتالوبرام.';
    const result = filter.filter(input);
    expect(result.text).not.toContain('سيرترالين');
  });

  it('"الدواء الأساسي" → يُعاد تسميته', () => {
    const input = 'الدواء الأساسي: بعض المعلومات';
    const result = filter.filter(input);
    expect(result.text).toContain('الارتباط الدوائي الرمزي');
  });

  it('"المكمل" يبقى آمناً', () => {
    const input = 'المكمل: 5-HTP، مغنيسيوم، أوميغا-3';
    const result = filter.filter(input);
    expect(result.text).toContain('المكملات الآمنة');
  });

  it('قسم طبي → يُضاف تنبيه قانوني', () => {
    const input = 'الموسوعة الطبية: الناقل العصبي سيروتونين.';
    const result = filter.filter(input);
    expect(result.text).toContain('ملاحظة قانونية');
  });

  it('نص فارغ → لا يتعطل', () => {
    const result = filter.filter('');
    expect(result.text).toBe('');
    expect(result.applied).toBe(false);
  });

  it('singleton موجود', () => {
    expect(medicalFilter).toBeDefined();
    expect(typeof medicalFilter.filter).toBe('function');
  });
});

describe('MedicalFilter — سيناريوهات واقعية', () => {
  const filter = new MedicalFilter();

  it('تقرير طويل فيه جرعات متعددة → كلها محجوبة', () => {
    const report = `
# الموسوعة الطبية للجذر 2
◈ الناقل العصبي: سيروتونين
◈ الدواء الأساسي: SSRIs
◈ الجرعة: سيرترالين 50-200 mg
◈ المكمل: 5-HTP، أوميغا 3
◈ العلاج الحركي: يوغا، تاي تشي
    `;
    const result = filter.filter(report);
    expect(result.text).not.toContain('50-200 mg');
    expect(result.text).not.toContain('SSRIs');
    expect(result.text).toContain('5-HTP');
    expect(result.text).toContain('يوغا');
    expect(result.text).toContain('ملاحظة قانونية');
  });

  it('نص بلا أي ادعاء طبي → لا حجب', () => {
    const text = 'التقرير العميق: الهوية، الرنين، Schism، التقويم.';
    const result = filter.filter(text);
    expect(result.applied).toBe(false);
    expect(result.removedItems.length).toBe(0);
  });

  it('جرعات بأشكال مختلفة → كلها محجوبة', () => {
    const text = 'جرعة 10 mg. وصف 250mg. المقدار 5 ملغ.';
    const result = filter.filter(text);
    expect(result.text).not.toContain('10 mg');
    expect(result.text).not.toContain('250mg');
    expect(result.text).not.toContain('5 ملغ');
  });

  it('أسماء أدوية متعددة بالعربية → كلها محجوبة', () => {
    const text = 'يستخدم سيرترالين وإسيتالوبرام وفلوكسيتين.';
    const result = filter.filter(text);
    expect(result.text).not.toContain('سيرترالين');
    expect(result.text).not.toContain('إسيتالوبرام');
    expect(result.text).not.toContain('فلوكسيتين');
  });

  it('"الارتباط الدوائي الرمزي" يظهر بعد المعالجة', () => {
    const text = 'الدواء الأساسي: SSRIs (Sertraline, Escitalopram)';
    const result = filter.filter(text);
    expect(result.text).toContain('الارتباط الدوائي الرمزي');
  });
});
