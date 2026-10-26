import {
  calculate,
  normalizePlanetKey,
  normalizeElementKey,
} from './calculator';
import { analyzeCompounds } from './compoundAnalyzer';
import { generateSimpleWafq, formatWafqDetailed } from './wafqGenerator';
import { cleanRootText, cleanGenericText, extractTitle, stripRootIntro } from './textCleaner';
import { INTRO_PHILOSOPHY, LAYER_DEFINITIONS } from './definitions';
import { getRootFullText, getResonance, getResonanceBetween, getRemediesForRoot, getEncyclopediaRootSection } from '../data/encyclopedia';
import { buildMedicalSection } from '../data/medicalLookup';

import { ROOTS_FULL_TEXT } from '../data/roots';
import { PLANETS_FULL_TEXT } from '../data/planets';
import { SIGNS_FULL_TEXT } from '../data/signs';
import { ELEMENTS_FULL_TEXT } from '../data/elements';
import { HOUSES_FULL_TEXT } from '../data/houses';
import { REMAINDERS_FULL_TEXT } from '../data/remainders';
import { RESONANCE_FULL_TEXT } from '../data/resonance';
import { REMEDIES_TYPES_FULL as FALLBACK_REMEDIES } from '../data/remedies';


// ═══════════════════════════════════════════════════════════
// محسنات العرض — فواصل بصرية للصفات والتعريفات
// ═══════════════════════════════════════════════════════════
const fmtText = (text: string): string => {
  if (!text) return '';
  
  let f = text;
  
  // توحيد الموصلات
  f = f.replace(/الظل و\s*الصفات السلبية الموسعة\s*:/g, 'الصفات السلبية / الظل:');
  f = f.replace(/الظل و\s*\n+\s*الصفات السلبية الموسعة\s*:/g, 'الصفات السلبية / الظل:');
  f = f.replace(/نقطة الانهيار \/\s*\n*\s*الظل\s*:/g, 'نقطة الانهيار / الظل:');
  // لا نحذف "نقطة الانهيار /" — نتركه يتحد مع "الظل"
  
  const subheadings = [
    'الصفات السلبية / الظل',
    'نقطة الانهيار / الظل',
    'الصفات الإيجابية الموسعة',
    'الصفات السلبية الموسعة',
    'الظل الجفري',
    'الحروف المنتمية له',
    'الهوية العامة والمعنى البنيوي',
    'القاعدة التشغيلية النهائية والقانون البنيوي الجامع',
    'العلاقات والتوافقات والتصادمات البينية',
    'نقطة الضعف البنيوية والظل',
    'نقطة الضعف البنيوية',
    'نمط التوتر والانهيار',
    'الترياق والتوازن',
    'البيئة الحاضنة',
    'البيئة الضاغطة',
    'نمط التفكير',
    'ما يظهر للناس',
    'ما يخفيه في العمق',
    'ما تخفيه في الباطن',
    'ما يخفيه',
    'ما تخفيه',
    'القوة الأساسية',
    'نقطة الانهيار',
    'محرك الفشل',
    'محرك الخلل',
    'الأثر التشغيلي',
    'النص النهائي الجاهز',
    'النص النهائي',
    'التفاصيل الكاملة والطبع',
    'البيئة المناسبة',
    'الوظيفة الأساسية',
    'الموقع داخل النظام',
    'الهوية العامة',
    'المعنى البنيوي',
    'الصفات الإيجابية',
    'الصفات السلبية',
    'العمق الداخلي',
    'المفهوم',
    'الوظيفة',
    'الظل'
  ];
  
  for (const kw of subheadings) {
    if (f.includes('### 🎯 ' + kw)) continue;
    f = f.split(kw + ':').join('\n\n### 🎯 ' + kw + '\n\n');
  }
  
  return f.replace(/\n{4,}/g, '\n\n\n').trim();
};

const defBox = (text: string): string => {
  if (!text) return '';
  const lines = text.trim().split('\n');
  if (lines.length === 0) return '';
  
  const title = lines[0].replace(/【|】/g, '').trim();
  const body = lines.slice(1).join('\n').trim();
  
  // إخراج كـ Box (بدون >) حتى يلتقطه reportBlocksParser
  return `\n\n【 📘 ${title} 】\n\n${body}\n\n`;
};


// ═══════════════════════════════════════════════════════════
// حساب القطبية والانحياز البنيوي — ديناميكي من الاسم
// ═══════════════════════════════════════════════════════════
const computePolarity = (root: number) => {
  const isPositive = root % 2 === 1;
  return {
    label: isPositive ? 'موجبة' : 'سالبة',
    direction: isPositive ? 'فاعلة دافعة' : 'مستقبلة مستوعبة',
    description: isPositive
      ? `الجذر ${root} فردي — قطبيته موجبة. تتحرك طاقته من المركز نحو المحيط: تبادر، تُعطي، تُقرّر، وتُهاجم. صاحب هذا الاسم يميل إلى الفعل المباشر والمبادرة السريعة.`
      : `الجذر ${root} زوجي — قطبيته سالبة. تتحرك طاقته من المحيط نحو المركز: تستقبل، تحتوي، تنتظر، وتُقرّر بعد التأمل. صاحب هذا الاسم يميل إلى الاستيعاب والتفكير العميق قبل الحركة.`,
    strength: isPositive ? 'اندفاع · إقدام · عطاء' : 'عمق · استيعاب · انتظار'
  };
};

const computeBias = (root: number, acquired: string, internal: string) => {
  const sameAsInternal = acquired === internal;
  
  const biasDescriptions: Record<string, { quality: string; add: string }> = {
    'ناري': { quality: 'حرارة وجرأة', add: 'يمنح سرعة قرار، اندفاع، وحضوراً طاغياً فوق طبعه الأساسي' },
    'مائي': { quality: 'عمق وحساسية', add: 'يمنح حدساً قوياً، تعاطفاً، وعمقاً عاطفياً فوق طبعه الأساسي' },
    'هوائي': { quality: 'مرونة وتواصل', add: 'يمنح لغة اجتماعية، تكيفاً، وتنقلاً بين الأفكار فوق طبعه الأساسي' },
    'ترابي': { quality: 'ثبات وصلابة', add: 'يمنح صبراً، بناءً متيناً، وثقة في النفس فوق طبعه الأساسي' }
  };
  
  const b = biasDescriptions[acquired] || { quality: 'بصمة فردية', add: 'يمنح لوناً خاصاً' };
  
  return {
    element: acquired,
    quality: b.quality,
    description: sameAsInternal
      ? `الطبع المكتسب (${acquired}) يطابق طبع الجذر — وهذا يُضاعف بصمة "${b.quality}" لدى صاحب هذا الاسم. ${b.add}.`
      : `الطبع المكتسب (${acquired}) يختلف عن طبع الجذر (${internal}) — وهذا يُدخل بصمة "${b.quality}" جديدة فوق الجذر ${root}. ${b.add}.`,
    isReinforcing: sameAsInternal
  };
};

const fmtBaawqi = (text: string): string => {
  if (!text) return '';
  const keys = [
    'الاسم الجفري',
    'الجوهر',
    'الظاهر',
    'الباطن',
    'القوة',
    'الضعف',
    'الظل عند الإفراط',
    'الظل',
    'المقابل الجفري الذي يوازنه',
    'المقابل',
    'البدل',
    'الترياق والعلاج',
    'الترياق',
    'الرنين والتوافق',
    'الرنين',
    'الختم',
    'مخرج الاتزان',
    'النص النهائي الجاهز',
    'النص النهائي'
  ];
  let f = text;
  for (const kw of keys) {
    const re = new RegExp('(^|[\\n\\s])' + kw + '\\s*:\\s*', 'g');
    f = f.replace(re, '\n\n### 🎯 ' + kw + '\n\n');
  }
  return f.replace(/\n{4,}/g, '\n\n\n').trim();
};



export const buildReport = (name: string, symptoms: string[] = []) => {
  const calc = calculate(name);
  if ('error' in calc) {
    return { error: calc.error };
  }

  const root = calc.root;
  const polarity = computePolarity(root);
  const bias = computeBias(root, calc.acquiredElement, calc.internal?.element ?? '');

  const rawRootText = getRootFullText(root) || ROOTS_FULL_TEXT[root] || '';
  const cleanedRoot = cleanRootText(rawRootText, root);
  const rootTitle = extractTitle(cleanedRoot) || `الجذر ${root}`;
  const rootText = fmtText(stripRootIntro(cleanedRoot));

  const internalPlanetKey = normalizePlanetKey(calc.internal.planet);
  const internalElementKey = normalizeElementKey(calc.internal.element);
  const internalPlanetText = fmtText(cleanGenericText(PLANETS_FULL_TEXT[internalPlanetKey] || ''));
  const internalSignText = fmtText(cleanGenericText(SIGNS_FULL_TEXT[calc.internal.sign] || ''));
  const internalElementText = fmtText(cleanGenericText(ELEMENTS_FULL_TEXT[internalElementKey] || ''));
  const internalHouseText = fmtText(cleanGenericText(HOUSES_FULL_TEXT[calc.internal.house] || ''));

  const externalPlanetKey = normalizePlanetKey(calc.external.planet);
  const externalElementKey = normalizeElementKey(calc.external.element);
  const externalSignText = fmtText(cleanGenericText(SIGNS_FULL_TEXT[calc.external.sign] || ''));
  const externalPlanetText = fmtText(cleanGenericText(PLANETS_FULL_TEXT[externalPlanetKey] || ''));
  const externalElementText = fmtText(cleanGenericText(ELEMENTS_FULL_TEXT[externalElementKey] || ''));
  const externalHouseText = fmtText(cleanGenericText(HOUSES_FULL_TEXT[calc.external.houseNumber] || ''));

  const acquiredElementKey = normalizeElementKey(calc.acquiredElement);
  const acquiredElementText = fmtText(cleanGenericText(ELEMENTS_FULL_TEXT[acquiredElementKey] || ''));

  const remainder9Text = fmtBaawqi(cleanGenericText(REMAINDERS_FULL_TEXT[calc.remainders.on9] || ''));
  const remainder7Text = fmtBaawqi(cleanGenericText(REMAINDERS_FULL_TEXT[calc.remainders.on7] || ''));
  const remainder28Text = fmtBaawqi(cleanGenericText(REMAINDERS_FULL_TEXT[calc.remainders.on28] || ''));

  const resonanceRaw =
    getResonanceBetween(root, root) ||
    RESONANCE_FULL_TEXT[`${root}_${root}`] ||
    '';
  const resonanceText = cleanGenericText(resonanceRaw);

  let remedyText = '';
  try {
    const remedies = getRemediesForRoot(root);
    if (remedies && remedies.remedy) {
      remedyText = `${remedies.remedy}`;
    } else if (Array.isArray(remedies) && remedies.length > 0) {
      remedyText = `الترياق المقترح: الجذور ${remedies.join('، ')}`;
    } else {
      remedyText = FALLBACK_REMEDIES['ترياق التثبيت'] || '';
    }
  } catch {
    remedyText = FALLBACK_REMEDIES['ترياق التثبيت'] || '';
  }

  const compounds = analyzeCompounds(calc.letters);
  const wafqGrid = generateSimpleWafq(calc.values);
  const wafqStr = formatWafqDetailed(wafqGrid);

  let fullReport = `
═══════════════════════════════════════════════════════════
       نظام الجفر الطبي الذكي — ميزان المرآة الذكي
═══════════════════════════════════════════════════════════

👤 الاسم: ${name}
🧬 الجذر: ${root}
📅 التاريخ: ${new Date().toLocaleString('ar-EG')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       📖 ديباجة النظام — الإطار المفاهيمي
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${INTRO_PHILOSOPHY}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 القسم الأول: الملخص التنفيذي 】


╭───────────────────────────────────────────────────────╮
│  الطبقة الداخلية (الجذر)                              │
├───────────────────────────────────────────────────────┤
│  الجذر:           ${root} - ${rootTitle}
│  طبع الجذر:       ${calc.internal.element}
│  الكوكب الداخلي:  ${calc.internal.planet}
│  البرج الداخلي:   ${calc.internal.sign}
│  البيت الداخلي:   ${calc.internal.house} - ${calc.internal.houseName}
╰───────────────────────────────────────────────────────╯

╭───────────────────────────────────────────────────────╮
│  الطبقة الخارجية (الباقي على 12)                      │
├───────────────────────────────────────────────────────┤
│  الباقي على 12:   ${calc.external.houseNumber}
│  البيت الخارجي:   ${calc.external.houseName}
│  البرج الخارجي:   ${calc.external.sign}
│  الكوكب الخارجي:  ${calc.external.planet}
│  طبع البرج:       ${calc.external.element}
╰───────────────────────────────────────────────────────╯

╭───────────────────────────────────────────────────────╮
│  الطبع المكتسب (من حروف الاسم)                        │
├───────────────────────────────────────────────────────┤
│  الطبع المكتسب:   ${calc.acquiredElement}
╰───────────────────────────────────────────────────────╯

╭───────────────────────────────────────────────────────╮
│  الميزان العددي                                       │
├───────────────────────────────────────────────────────┤
│  الحروف:          ${calc.letters.join('، ')}
│  القيم:           ${calc.values.join('، ')}
│  المجموع:         ${calc.total}
│  الجذر الرقمي:    ${calc.digitalRoot}
│  البواقي:         9=${calc.remainders.on9}، 7=${calc.remainders.on7}، 12=${calc.remainders.on12}، 28=${calc.remainders.on28}
╰───────────────────────────────────────────────────────╯

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${defBox(LAYER_DEFINITIONS.root)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 القسم الثاني: الجذر الحقيقي 】

${rootText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 القسم الثالث: الطبقة الداخلية — تفاصيل الجذر 】

${defBox(LAYER_DEFINITIONS.element)}

◈ طبع الجذر (الداخلي): ${calc.internal.element}
${internalElementText}

───────────────────────────────────────────────────────────

${defBox(LAYER_DEFINITIONS.planet)}

◈ الكوكب الداخلي: ${calc.internal.planet}
${internalPlanetText}

───────────────────────────────────────────────────────────

${defBox(LAYER_DEFINITIONS.sign)}

◈ البرج الداخلي: ${calc.internal.sign}
${internalSignText}

───────────────────────────────────────────────────────────

${defBox(LAYER_DEFINITIONS.house)}

◈ البيت الداخلي: ${calc.internal.house} - ${calc.internal.houseName}
${internalHouseText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 القسم الرابع: الطبقة الخارجية — الباقي على 12 】

◈ وصف الباقي على 12 (${calc.external.houseNumber}) — البيت الخارجي:
${calc.external.houseNumber === calc.internal.house 
  ? `(يتطابق مع البيت الداخلي رقم ${calc.internal.house} — راجع القسم الثالث للحصول على التفاصيل الكاملة)`
  : externalHouseText}

───────────────────────────────────────────────────────────

◈ البرج الخارجي: ${calc.external.sign}
${externalSignText}

───────────────────────────────────────────────────────────

◈ الكوكب الخارجي: ${calc.external.planet}
${externalPlanetText}

───────────────────────────────────────────────────────────

◈ طبع البرج الخارجي: ${calc.external.element}
${externalElementText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 القسم الخامس: الطبع المكتسب — تحليل حروف الاسم 】

◈ الطبع المكتسب من الحروف: ${calc.acquiredElement}
${acquiredElementText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 القسم السادس: البواقي التفصيلية 】

◈ الباقي على 9 (الجذر): ${calc.remainders.on9}
${remainder9Text}

───────────────────────────────────────────────────────────

◈ الباقي على 7 (السر): ${calc.remainders.on7}
${remainder7Text}

───────────────────────────────────────────────────────────

◈ الباقي على 28 (الحرف): ${calc.remainders.on28}
${remainder28Text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 القسم السابع: رنين الجذر مع نفسه (${root}+${root}) 】

${resonanceText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🎯 ماذا يعني رنين الجذر مع نفسه؟

عندما يرن الجذر مع نفسه (${root}+${root})، فهذا يعني أن صاحب الاسم يحمل مضاعفاً من طبعه الجذري. النتيجة:

• نعمة مضاعفة: إذا استقام الجذر، تتضاعف قدرته على العطاء والاحتواء والتوازن.
• نقمة مضاعفة: إذا اعوج الجذر، يتضاعف تعلقه وتردده وحاجته للآخر.
• دعوة للوعي: الرنين مع النفس يكشف "النسخة المكثفة" من الجذر — وهي النسخة التي تحتاج أعظم وعي وحكمة لإدارتها.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 القسم الثامن: التراكيب الثنائية المستخلصة 】

${Array.isArray(compounds) && compounds.length > 0 
  ? compounds.join('\n') 
  : `لا توجد تراكيب ثنائية مطابقة لحروف "${name}" في النظام.\n\nالتراكيب الثنائية تتشكل عندما تنتج أزواج حروف الاسم تراكيب معروفة (مثل: بسم، نور، ماء). حروف "${name}" لا تُنتج أي تركيب معروف حالياً.`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 القسم التاسع: القطبية وحركة الطاقة — Polarity 】

📊 القطبية الفعلية لاسم "${name}": 【 ${polarity.label} — ${polarity.direction} 】

${polarity.description}

◈ القوة الحاملة للقطبية: ${polarity.strength}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 التعريف الموسوعي للقطبية:

${LAYER_DEFINITIONS.polarity}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${symptoms.length > 0 ? `【 الأعراض المدخلة 】\n${symptoms.join('، ')}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` : ''}

【 القسم العاشر: التوصية العامة 】

${remedyText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🎯 ماذا تفعل الآن؟ (خطوات عملية)

1️⃣ ابدأ بتحديد حدودك الشخصية:
   ضع قائمة بـ 3 أشياء تقول لها "لا" بانتظام. هذه هي حدودك التي تحميك من الاستنزاف.

2️⃣ مارس قراراً واضحاً يومياً:
   اتخذ قراراً واحداً صغيراً دون استشارة أحد. هذا يبني استقلالك العاطفي تدريجياً.

3️⃣ تحرر من رهان رضا الآخرين:
   ذكّر نفسك: "قيمتي لا تتوقف على تصفيق الناس".

4️⃣ ابنِ مساحة داخلية آمنة:
   خصص 10 دقائق يومياً للجلوس مع نفسك بلا هاتف ولا ضجيج.

5️⃣ اعتنق المبدأ الذهبي للجذر ${root}:
   الاحتواء الحقيقي يبدأ باحتواء الذات — فمن لا يحتوي نفسه لا يستطيع احتواء غيره.
`;

  // ═══════════════════════════════════════════════════════════
  // القسم الحادي عشر: الانحياز البنيوي
  // ═══════════════════════════════════════════════════════════
  fullReport += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 القسم الحادي عشر: الانحياز البنيوي — بصمة التفرد 】

📊 انحياز اسم "${name}": 【 ${bias.element} — ${bias.quality} 】

${bias.description}

◈ نوع الانحياز: ${bias.isReinforcing ? 'مُضاعِف (يشدّد الجذر)' : 'مُوسِّع (يضيف لوناً جديداً)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 التعريف الموسوعي للانحياز:

${LAYER_DEFINITIONS.bias}
`;

  // ═══════════════════════════════════════════════════════════
  // القسم الثاني عشر: مبادئ التكوين والتكامل
  // ═══════════════════════════════════════════════════════════
  fullReport += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 القسم الثاني عشر: مبادئ التكوين والتكامل الشامل 】

${LAYER_DEFINITIONS.integration.replace('【 مبادئ التكوين والتكامل الشامل 】', '').trim()}
`;

  // ═══════════════════════════════════════════════════════════
  // الخاتمة
  // ═══════════════════════════════════════════════════════════
  fullReport += `

═══════════════════════════════════════════════════════════
       🔗 نظام الجفر الطبي الذكي — الإصدار 3.0
═══════════════════════════════════════════════════════════
`;

  return {
    entity: name,
    root,
    rootTitle,
    internalElement: calc.internal.element,
    internalPlanet: calc.internal.planet,
    internalSign: calc.internal.sign,
    internalHouse: calc.internal.house,
    externalHouseNumber: calc.external.houseNumber,
    externalSign: calc.external.sign,
    externalPlanet: calc.external.planet,
    externalElement: calc.external.element,
    acquiredElement: calc.acquiredElement,
    fullReport,
    calculation: calc,
    compounds,
    wafq: wafqStr,
  };
};

export default buildReport;
