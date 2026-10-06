import { externalStorage, UserEntity } from '../utils/externalStorage';
import { reflectiveArchetypesEngine } from '../domain/services/ReflectiveArchetypesEngine';
import { resonanceEngine } from '../domain/services/ResonanceEngine';
import { temporalAnalyzer } from '../domain/services/TemporalAnalyzer';
import { buildReport } from '../engine/reportBuilder';
import { DeepDiveReport } from '../products/DeepDiveReport';

// ═══════════════════════════════════════════════════════════
// النوع الموحد للسياق
// ═══════════════════════════════════════════════════════════
export interface AggregatedContext {
  name: string;
  layers: any;
  deepDiveMarkdown?: string;   // التقرير العميق
  traditionalMarkdown?: string; // التقرير التقليدي
  reflectiveProfile?: any;     // 12 محوراً
  externalEvidence: Array<{
    title: string;
    source: string;
    excerpt: string;
    score: number;
    matchedKeywords: string[];
  }>;
  resonance?: any;
  temporal?: any;
  sources: string[];  // أسماء المصادر المُستخدَمة
}

// ═══════════════════════════════════════════════════════════
function normAr(t: string): string {
  if (!t) return '';
  return String(t)
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// ═══════════════════════════════════════════════════════════
// استخراج كلمات مفتاحية من سؤال المستخدم
// ═══════════════════════════════════════════════════════════
function extractQueryKeywords(question: string): string[] {
  const tokens = normAr(question).split(/[\s،؟?.,:؛!]+/);
  const stopwords = new Set([
    'من','في','على','عن','إلى','هو','هي','هذا','هذه','ذلك','التي','الذي','كيف','ماذا','لماذا','هل','ما',
    'واحد','واحدة','أنا','أنت','نحن','مع','بين','حول','عند','لدى','كان','يكون','لي','لك','له','لها'
  ]);
  return tokens
    .filter((t) => t.length >= 3 && !stopwords.has(t))
    .slice(0, 10);
}

// ═══════════════════════════════════════════════════════════
// retrieveEvidence — يبحث في الموسوعات حسب سؤال المستخدم
// ═══════════════════════════════════════════════════════════
async function retrieveEvidence(
  question: string,
  analysis: any,
  maxResults: number = 6
): Promise<AggregatedContext['externalEvidence']> {
  const entities = await externalStorage.getAll();
  if (entities.length === 0) return [];

  // كلمات البحث = كلمات السؤال + محاور التحليل
  const qKw = extractQueryKeywords(question);
  const analysisKw: string[] = [];

  const L = analysis?.layers ?? analysis ?? {};
  if (L.root !== undefined) analysisKw.push(`الجذر ${L.root}`, `root_${L.root}`);
  if (L.planet) analysisKw.push(L.planet);
  if (L.sign) analysisKw.push(L.sign);
  if (L.element) analysisKw.push(L.element);
  if (L.house !== undefined) analysisKw.push(`البيت ${L.house}`);

  const allKw = [...qKw, ...analysisKw.map(normAr)];

  const scored: Array<{ e: UserEntity; score: number; hits: string[] }> = [];

  for (const e of entities) {
    const haystack = normAr(`${e.titleAr} ${e.fullText} ${(e.keywords ?? []).join(' ')}`);
    let score = 0;
    const hits: string[] = [];

    for (const kw of allKw) {
      if (kw.length < 2) continue;
      try {
        const re = new RegExp(`(^|[\\s،.؛:!?\\-_/])${kw.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}($|[\\s،.؛:!?\\-_/])`);
        if (re.test(haystack)) {
          score += kw.length >= 5 ? 3 : 2;
          hits.push(kw);
        }
      } catch { /* ignore */ }
    }

    if (score >= 2) scored.push({ e, score, hits });
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxResults).map((s) => ({
    title: s.e.titleAr,
    source: s.e.sourceFile,
    excerpt: s.e.fullText.length > 500 ? s.e.fullText.slice(0, 500) + '…' : s.e.fullText,
    score: s.score,
    matchedKeywords: s.hits,
  }));
}

// ═══════════════════════════════════════════════════════════
// buildContext — يجمع كل شيء
// ═══════════════════════════════════════════════════════════
export async function buildAggregatedContext(params: {
  name: string;
  analysis: any;
  question: string;
  deepDiveMarkdown?: string;
  traditionalMarkdown?: string;
}): Promise<AggregatedContext> {
  const { name, analysis, question } = params;
  const sources: string[] = [];
  const ctx: AggregatedContext = {
    name,
    layers: analysis?.layers ?? analysis,
    externalEvidence: [],
    sources,
  };

  // ═══ 1) التقرير التقليدي — توليد لحظي إن لم يُمرَّر ═══
  try {
    if (params.traditionalMarkdown) {
      ctx.traditionalMarkdown = params.traditionalMarkdown;
      sources.push('📜 تقرير تقليدي (محفوظ)');
    } else if (name) {
      const report = buildReport(name, []);
      const text = (report as any).fullReport ?? (report as any).text ?? '';
      if (text && text.length > 100) {
        ctx.traditionalMarkdown = text;
        sources.push('📜 تقرير تقليدي (حي)');
        console.log(`🔍 [Context] تقرير تقليدي حي: ${text.length} حرف`);
      }
    }
  } catch (e) {
    console.warn('⚠️ traditional failed:', e);
  }

  // ═══ 2) التقرير العميق — توليد لحظي ═══
  try {
    if (params.deepDiveMarkdown) {
      ctx.deepDiveMarkdown = params.deepDiveMarkdown;
      sources.push('📊 تقرير عميق (محفوظ)');
    } else if (analysis && analysis.status !== 'abstained') {
      const engine = new DeepDiveReport();
      const out = engine.generate(analysis, 'personal', { richMarkdown: analysis.report });
      const text = (out as any).markdown ?? (out as any).fullReport ?? '';
      if (text && text.length > 100) {
        ctx.deepDiveMarkdown = text;
        sources.push('📊 تقرير عميق (حي)');
        console.log(`🔍 [Context] تقرير عميق حي: ${text.length} حرف`);
      }
    }
  } catch (e) {
    console.warn('⚠️ deepDive failed:', e);
  }

  // ═══ 3) الملف النفسي ═══
  try {
    if (analysis?.layers) {
      const profile = reflectiveArchetypesEngine.analyze(name, analysis.layers);
      ctx.reflectiveProfile = {
        dominantAxis: profile.dominantAxis,
        weakestAxis: profile.weakestAxis,
        overallBalance: profile.overallBalance,
        topAxes: profile.axes.slice(0, 5).map((a: any) => ({
          title: a.title,
          score: Math.round(a.score * 100),
          narrative: a.narrative,
        })),
      };
      sources.push('🧠 ملف نفسي');
    }
  } catch (e) {
    console.warn('⚠️ reflective failed:', e);
  }

  // ═══ 4) الرنين ═══
  try {
    const rootNum = typeof ctx.layers?.root === 'number' ? ctx.layers.root : Number(ctx.layers?.root);
    if (rootNum >= 1 && rootNum <= 9) {
      const resonance = resonanceEngine.getForRoot(rootNum);
      if (resonance && resonance.length > 0) {
        ctx.resonance = resonance;
        sources.push('🎵 رنين');
      }
    }
  } catch (e) {
    console.warn('⚠️ resonance failed:', e);
  }

  // ═══ 5) الشواهد الخارجية — بحث حي حسب السؤال ═══
  try {
    const evidence = await retrieveEvidence(question, analysis);
    ctx.externalEvidence = evidence;
    if (evidence.length > 0) {
      const uniqueSources = Array.from(new Set(evidence.map((e) => e.source)));
      sources.push(`🌐 موسوعات (${uniqueSources.length})`);
      console.log(`🔍 [Context] شواهد: ${evidence.length} من ${uniqueSources.length} مصدر`);
    }
  } catch (e) {
    console.warn('⚠️ evidence failed:', e);
  }

  return ctx;
}


// ═══════════════════════════════════════════════════════════
// extractRelevantSections — يقتطع من التقرير الأجزاء المتعلقة بالاسم/المحاور
// ═══════════════════════════════════════════════════════════
function extractRelevantSections(
  text: string,
  keywords: string[],
  maxSections: number = 6,
  maxCharsPerSection: number = 800
): string {
  if (!text || text.length < 100) return '';

  const norm = (t: string) => String(t ?? '')
    .replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .toLowerCase();

  const lines = text.split('\n');
  const sections: string[] = [];
  let currentSection: string[] = [];
  let currentHasKeyword = false;

  const pushSection = () => {
    if (currentHasKeyword && currentSection.length > 0) {
      sections.push(currentSection.slice(0, 30).join('\n'));
    }
    currentSection = [];
    currentHasKeyword = false;
  };

  const kwNorm = keywords.map(norm).filter((k) => k.length >= 2);

  for (const line of lines) {
    // بداية قسم جديد = heading
    if (/^#{1,4}\s/.test(line) || /^\*\*[^*]+\*\*$/.test(line.trim())) {
      pushSection();
      currentSection = [line];
      continue;
    }

    currentSection.push(line);

    // هل السطر يحوي كلمة مفتاحية؟
    const lineNorm = norm(line);
    if (kwNorm.some((k) => lineNorm.includes(k))) {
      currentHasKeyword = true;
    }

    if (currentSection.length > 100) pushSection();
  }
  pushSection();

  // اقتصاص
  return sections
    .slice(0, maxSections)
    .map((sec) => {
      const trimmed = sec.length > maxCharsPerSection
        ? sec.slice(0, maxCharsPerSection) + '…'
        : sec;
      return trimmed;
    })
    .join('\n\n');
}

// ═══════════════════════════════════════════════════════════
// contextToPrompt — يحوّل السياق إلى نص للـLLM
// ═══════════════════════════════════════════════════════════
export function contextToPrompt(ctx: AggregatedContext, question: string): string {
  const parts: string[] = [];

  parts.push(`# تحليل كامل لاسم "${ctx.name}"`);
  parts.push(`هذا السياق مخصص للإجابة عن أسئلة المستخدم حول هذا الاسم تحديداً.`);
  parts.push('');

  const L = ctx.layers ?? {};
  parts.push(`## المحاور الأساسية`);
  if (L.root !== undefined) parts.push(`- الجذر: ${L.root}`);
  if (L.planet) parts.push(`- الكوكب: ${L.planet}`);
  if (L.sign) parts.push(`- البرج: ${L.sign}`);
  if (L.element) parts.push(`- الطبع: ${L.element}`);
  if (L.house !== undefined) parts.push(`- البيت: ${L.house}`);
  parts.push('');

  if (ctx.reflectiveProfile) {
    parts.push(`## الملف النفسي`);
    parts.push(`- أقوى محور: ${ctx.reflectiveProfile.dominantAxis}`);
    parts.push(`- أضعف محور: ${ctx.reflectiveProfile.weakestAxis}`);
    parts.push(`- التوازن العام: ${Math.round(ctx.reflectiveProfile.overallBalance * 100)}%`);
    parts.push('');
    ctx.reflectiveProfile.topAxes.forEach((a: any) => {
      parts.push(`### ${a.title} (${a.score}%)`);
      parts.push(a.narrative.slice(0, 400));
      parts.push('');
    });
  }

  if (ctx.traditionalMarkdown) {
    const L2 = ctx.layers ?? {};
    const kws: string[] = [];
    if (ctx.name) kws.push(ctx.name);
    if (L2.root !== undefined) kws.push(`الجذر ${L2.root}`);
    if (L2.planet) kws.push(L2.planet);
    if (L2.sign) kws.push(L2.sign);
    if (L2.element) kws.push(L2.element);
    if (L2.house !== undefined) kws.push(`البيت ${L2.house}`);

    const excerpt = extractRelevantSections(ctx.traditionalMarkdown, kws, 8, 900);
    parts.push(`## مقتطفات مركزة من التقرير التقليدي (نصوص البوني عن ${ctx.name})`);
    parts.push(excerpt || ctx.traditionalMarkdown.slice(0, 2500));
    parts.push('');
  }

  if (ctx.externalEvidence.length > 0) {
    parts.push(`## شواهد من الموسوعات الخارجية`);
    ctx.externalEvidence.forEach((ev, i) => {
      parts.push(`### ${i + 1}. ${ev.title} [المصدر: ${ev.source}]`);
      parts.push(ev.excerpt);
      parts.push('');
    });
  }

  parts.push(`---`);
  parts.push(`## سؤال المستخدم`);
  parts.push(question);

  return parts.join('\n');
}
