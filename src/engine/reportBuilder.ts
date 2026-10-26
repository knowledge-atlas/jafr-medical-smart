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



const getRecSteps = (root: number): string[] => {
  const MAP: Record<number, string[]> = {
    1: [
      'لا تنتظر اكتمال الأدوات — ابدأ بخطوة واحدة واضحة اليوم',
      'اترك مجالاً للآخرين — لا تحمل القيادة وحدك',
      'راجع قراراتك بعد 24 ساعة — بعضها متسرع',
      'اعترف بالضعف أحياناً — القائد القوي يعترف',
      'اعتنق المبدأ الذهبي للجذر 1: البداية الشجاعة نصف النجاح',
    ],
    2: [
      'ضع قائمة بـ 3 أشياء تقول لها "لا" بانتظام — حدودك تحميك',
      'اتخذ قراراً واحداً صغيراً يومياً دون استشارة أحد',
      'ذكّر نفسك: "قيمتي لا تتوقف على تصفيق الناس"',
      'خصص 10 دقائق يومياً للجلوس مع نفسك بلا هاتف',
      'اعتنق المبدأ الذهبي للجذر 2: الاحتواء يبدأ باحتواء الذات',
    ],
    3: [
      'اكتب أفكارك بدلاً من كثرة الكلام — الحكمة في الاختصار',
      'أكمل مشروعاً واحداً قبل بدء آخر',
      'خصص وقتاً للصمت يومياً — الإلهام يحتاج هدوءاً',
      'تحقق من الحقائق قبل نشرها',
      'اعتنق المبدأ الذهبي للجذر 3: الكلمة الطيبة صدقة',
    ],
    4: [
      'خصص 30 دقيقة يومياً للراحة الحقيقية — لا إنتاجية',
      'جرّب شيئاً جديداً مرة أسبوعياً — ولو صغيراً',
      'شارك مشاعرك مع شخص تثق به',
      'لا تجعل الكمال عدوك — 80% كافٍ',
      'اعتنق المبدأ الذهبي للجذر 4: الأمان في الداخل لا في الخارج',
    ],
    5: [
      'خصص وقتاً للعب والفرح يومياً — ليس ترفاً',
      'اكتب 3 أشياء تشكرها كل صباح',
      'قرر قراراً واحداً جريئاً هذا الشهر',
      'قلّل التحقق من الهاتف — اخرج للعالم',
      'اعتنق المبدأ الذهبي للجذر 5: الحرية في الاختيار لا في الهروب',
    ],
    6: [
      'ضع حدوداً صحية للرعاية — ليس إنقاذاً',
      'اطلب المساعدة عندما تحتاجها',
      'خصّص وقتاً لجماليات الحياة — ليس كل شيء عملاً',
      'لا تحمل مسؤولية قرارات الآخرين',
      'اعتنق المبدأ الذهبي للجذر 6: رعاية الذات قبل رعاية الآخرين',
    ],
    7: [
      'اربط تحليلك بالفعل — لا تكتفِ بالتفكير',
      'شارك اكتشافاتك مع شخص واحد على الأقل هذا الأسبوع',
      'اخرج من عزلتك — الحياة في الخارج',
      'حدد وقتاً لاتخاذ القرار — لا تؤجل للأبد',
      'اعتنق المبدأ الذهبي للجذر 7: الفهم بلا تطبيق ضياع',
    ],
    8: [
      'تذكّر: وراء كل رقم إنسان — إنسانية القرار أولاً',
      'فوّض بعض الصلاحيات — لا تحمل كل شيء وحدك',
      'خصص وقتاً للراحة — القوة تحتاج تجديداً',
      'مارس الرحمة مع نفسك أولاً — لا تقسُ عليها',
      'اعتنق المبدأ الذهبي للجذر 8: القوة بلا رحمة طغيان',
    ],
    9: [
      'أغلق دورة انتهت — لا تحملها للأبد',
      'خصّص وقتاً لنفسك — العطاء بلا حدود استنزاف',
      'لا تُفرط في تحمّل هموم العالم',
      'قل "لا" عندما تحتاج — راحة نفسك حق',
      'اعتنق المبدأ الذهبي للجذر 9: الحكمة تحمي صاحبها أولاً',
    ],
  };
  return MAP[root] || MAP[2];
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
       الجفر التراثي الذكي — نظام التحليل الرمزي
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
${calc.remainders.on7 === calc.remainders.on28 
  ? `> ⚠️ هذا الباقي يُطابق الباقي على 28 (كلاهما = ${calc.remainders.on7}) — النص التالي يشرحه من زاوية "السر" فقط.`
  : ''}
${remainder7Text}

───────────────────────────────────────────────────────────

◈ الباقي على 28 (الحرف): ${calc.remainders.on28}
${calc.remainders.on7 === calc.remainders.on28 
  ? `> ⚠️ هذا الباقي يُطابق الباقي على 7 (كلاهما = ${calc.remainders.on28}) — راجع القسم السابق.`
  : ''}
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

${(() => {
  const steps = getRecSteps(root);
  return steps.map((step, i) => {
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
    return `${emojis[i]} ${step}`;
  }).join('\n\n');
})()}
`;

  // ═══════════════════════════════════════════════════════════
  // القسم الحادي عشر: الانحياز البنيوي
  // ═══════════════════════════════════════════════════════════
  fullReport += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 القسم الحادي عشر: الانحياز البنيوي — بصمة التفرد 】

📊 انحياز اسم "${name}": 【 ${bias.element} — ${bias.quality} 】

${bias.description}

◈ نوع الانحياز: ${bias.isReinforcing ? '🔁 مُضاعِف — الطبع المكتسب يشدّد طبع الجذر' : '➕ مُوسِّع — الطبع المكتسب يضيف لوناً جديداً'}

${bias.isReinforcing 
  ? `> 💡 بما أن الطبع المكتسب (${bias.element}) يُطابق طبع الجذر (${calc.internal?.element || '—'})، فهذا يعني أن صاحب الاسم يحمل **مضاعفاً** من نفس الطاقة — قوة مضاعفة، لكن أيضاً تحدٍّ مضاعف في إدارة هذه الطاقة.`
  : `> 💡 الطبع المكتسب (${bias.element}) يختلف عن طبع الجذر (${calc.internal?.element || '—'})، فهذا يُدخل **بُعداً جديداً** على الشخصية — طبقة إضافية تثري الجذر، لكنها قد تخلق توتراً بين الطبعين في مواقف معينة.`}

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
       🔗 الجفر التراثي الذكي — الإصدار 1.0.0
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
