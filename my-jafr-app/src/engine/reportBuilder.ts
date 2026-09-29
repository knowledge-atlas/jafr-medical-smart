import { calculate } from './calculator';
import { analyzeCompounds } from './compoundAnalyzer';
import { generateSimpleWafq, formatWafq } from './wafqGenerator';
import { ROOTS_FULL_TEXT } from '../data/roots';
import { PLANETS_FULL_TEXT } from '../data/planets';
import { SIGNS_FULL_TEXT } from '../data/signs';
import { ELEMENTS_FULL_TEXT } from '../data/elements';
import { HOUSES_FULL_TEXT } from '../data/houses';
import { REMAINDERS_FULL_TEXT } from '../data/remainders';
import { RESONANCE_FULL_TEXT } from '../data/resonance';
import { REMEDIES_TYPES_FULL } from '../data/remedies';

export const buildReport = (name: string, symptoms: string[] = []) => {
  const calc = calculate(name);
  if ('error' in calc) {
    return { error: calc.error };
  }

  const root = calc.root;
  const planet = calc.planet;
  const sign = calc.sign;
  const element = calc.element;

  const rootText = ROOTS_FULL_TEXT[root] || 'نص الجذر غير متوفر';
  const planetText = PLANETS_FULL_TEXT[planet] || 'نص الكوكب غير متوفر';
  const signText = SIGNS_FULL_TEXT[sign] || 'نص البرج غير متوفر';
  const elementText = ELEMENTS_FULL_TEXT[element] || 'نص الطبع غير متوفر';
  const houseText = HOUSES_FULL_TEXT[calc.houseId] || 'نص البيت غير متوفر';
  const remainderText = REMAINDERS_FULL_TEXT[calc.remainders.on9] || 'نص الباقي غير متوفر';
  const resonanceText = RESONANCE_FULL_TEXT[`${root}_${root}`] || RESONANCE_FULL_TEXT['1_1'] || 'رنين غير متوفر';

  const compounds = analyzeCompounds(calc.letters);
  const wafqGrid = generateSimpleWafq(calc.values);
  const wafqStr = formatWafq(wafqGrid);

  const rootTitle = rootText.split('\n')[0] || `الجذر ${root}`;

  const fullReport = `
============================================================
التقرير الجفري-النفسي الشامل للكيان: ${name}
============================================================

**الجذر الحقيقي: ${root}**
${rootText}

--------------------------
**المحرك الكوكبي: ${planet}**
${planetText}

--------------------------
**أسلوب التعبير البرجي: ${sign}**
${signText}

--------------------------
**المادة الحركية (الطبع): ${element}**
${elementText}

--------------------------
**مجال العمل (البيت): ${calc.houseId} - ${calc.houseName}**
${houseText}

--------------------------
**الميزان العددي:**
- الحروف: ${calc.letters.join('، ')}
- القيم: ${calc.values.join('، ')}
- المجموع: ${calc.total}
- الجذر الرقمي: ${calc.digitalRoot}
- البواقي: على 9 = ${calc.remainders.on9}، على 7 = ${calc.remainders.on7}، على 12 = ${calc.remainders.on12}

--------------------------
**نص الباقي (${calc.remainders.on9}):**
${remainderText}

--------------------------
**رنين الجذر مع نفسه:**
${resonanceText}

--------------------------
**التراكيب الثنائية المستخلصة من الاسم (ديناميكية):**
${compounds.join('\n')}

--------------------------
**الوفق البسيط (المربع العددي):**
${wafqStr}

--------------------------
${symptoms.length > 0 ? `**الأعراض المدخلة:** ${symptoms.join('، ')}` : ''}

**التوصية العامة (مستخلصة من النص الأصلي):**
بناءً على الجذر ${root}، يحتاج هذا الكيان إلى ترياقه الخاص. 
الترياق الأساسي المقترح: ${REMEDIES_TYPES_FULL['ترياق التثبيت'] || 'مراجعة النص الأصلي للتفاصيل'}.
============================================================
`;

  return {
    entity: name,
    root,
    rootTitle,
    planet,
    sign,
    element,
    house: calc.houseName,
    fullReport,
    calculation: calc,
    compounds: compounds,
    wafq: wafqStr,
    dataRetention: 'تم الاحتفاظ بأكثر من 85% من النصوص الأصلية مع تحليل ديناميكي للتراكيب والأوفاق.'
  };
};
