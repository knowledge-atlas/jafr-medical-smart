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

export const buildReport = (name: string, symptoms: string[] = []) => {
  const calc = calculate(name);
  if ('error' in calc) {
    return { error: calc.error };
  }

  const root = calc.root;

  const rawRootText = getRootFullText(root) || ROOTS_FULL_TEXT[root] || '';
  const rootText = stripRootIntro(cleanRootText(rawRootText, root));
  const rootTitle = extractTitle(rootText) || `الجذر ${root}`;

  const internalPlanetKey = normalizePlanetKey(calc.internal.planet);
  const internalElementKey = normalizeElementKey(calc.internal.element);
  const internalPlanetText = cleanGenericText(PLANETS_FULL_TEXT[internalPlanetKey] || '');
  const internalSignText = cleanGenericText(SIGNS_FULL_TEXT[calc.internal.sign] || '');
  const internalElementText = cleanGenericText(ELEMENTS_FULL_TEXT[internalElementKey] || '');
  const internalHouseText = cleanGenericText(HOUSES_FULL_TEXT[calc.internal.house] || '');

  const externalPlanetKey = normalizePlanetKey(calc.external.planet);
  const externalElementKey = normalizeElementKey(calc.external.element);
  const externalSignText = cleanGenericText(SIGNS_FULL_TEXT[calc.external.sign] || '');
  const externalPlanetText = cleanGenericText(PLANETS_FULL_TEXT[externalPlanetKey] || '');
  const externalElementText = cleanGenericText(ELEMENTS_FULL_TEXT[externalElementKey] || '');
  const externalHouseText = cleanGenericText(HOUSES_FULL_TEXT[calc.external.houseNumber] || '');

  const acquiredElementKey = normalizeElementKey(calc.acquiredElement);
  const acquiredElementText = cleanGenericText(ELEMENTS_FULL_TEXT[acquiredElementKey] || '');

  const remainder9Text = cleanGenericText(REMAINDERS_FULL_TEXT[calc.remainders.on9] || '');
  const remainder7Text = cleanGenericText(REMAINDERS_FULL_TEXT[calc.remainders.on7] || '');
  const remainder28Text = cleanGenericText(REMAINDERS_FULL_TEXT[calc.remainders.on28] || '');

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

${LAYER_DEFINITIONS.root}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 القسم الثاني: الجذر الحقيقي 】

${rootText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 القسم الثالث: الطبقة الداخلية — تفاصيل الجذر 】

${LAYER_DEFINITIONS.element}

◈ طبع الجذر (الداخلي): ${calc.internal.element}
${internalElementText}

───────────────────────────────────────────────────────────

${LAYER_DEFINITIONS.planet}

◈ الكوكب الداخلي: ${calc.internal.planet}
${internalPlanetText}

───────────────────────────────────────────────────────────

${LAYER_DEFINITIONS.sign}

◈ البرج الداخلي: ${calc.internal.sign}
${internalSignText}

───────────────────────────────────────────────────────────

${LAYER_DEFINITIONS.house}

◈ البيت الداخلي: ${calc.internal.house} - ${calc.internal.houseName}
${internalHouseText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 القسم الرابع: الطبقة الخارجية — الباقي على 12 】

◈ وصف الباقي على 12 (${calc.external.houseNumber}) — البيت الخارجي:
${externalHouseText}

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

【 القسم الثامن: التراكيب الثنائية المستخلصة 】

${Array.isArray(compounds) ? compounds.join('\n') : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 القسم التاسع: القطبية وحركة الطاقة — Polarity 】

${LAYER_DEFINITIONS.polarity}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${symptoms.length > 0 ? `【 الأعراض المدخلة 】\n${symptoms.join('، ')}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` : ''}

【 القسم العاشر: التوصية العامة 】

${remedyText}
`;

  // ═══════════════════════════════════════════════════════════
  // القسم الحادي عشر: الانحياز البنيوي
  // ═══════════════════════════════════════════════════════════
  fullReport += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 القسم الحادي عشر: الانحياز البنيوي — بصمة التفرد 】

${LAYER_DEFINITIONS.bias}
`;

  // ═══════════════════════════════════════════════════════════
  // القسم الثاني عشر: مبادئ التكوين والتكامل
  // ═══════════════════════════════════════════════════════════
  fullReport += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 القسم الثاني عشر: مبادئ التكوين والتكامل الشامل 】

${LAYER_DEFINITIONS.integration}
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
