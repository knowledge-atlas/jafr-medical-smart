import { AnalysisResult, NameAnalysisLayers } from '../application/use-cases/AnalyzeNameUseCase';
import { ContextMode } from './ContextAwarePrompter';

function extractNumber(id?: string): number | null {
  if (!id) return null;
  const m = id.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function humanizeLayer(id: string | undefined, kind: string): string {
  const n = extractNumber(id);
  const labels: Record<string, string> = {
    root: 'الجذر',
    planet: 'الكوكب',
    sign: 'البرج',
    house: 'البيت',
  };
  const label = labels[kind] ?? kind;
  return n !== null ? `${label} ${n}` : (id ?? label);
}

const ELEMENT_METAPHOR: Record<string, string> = {
  ناري: 'شعلة تتوق للحركة والوضوح',
  ترابي: 'جذر راسخ يبني على المدى الطويل',
  هوائي: 'نسمة تبحث عن التواصل والتبادل',
  مائي: 'نهر عميق يقرأ ما وراء الظاهر',
};

const MODE_OPENING: Record<ContextMode, (name: string, metaphor: string) => string> = {
  personal: (n, m) => `اسم "${n}" يحمل في طبعه ${m}.`,
  marital: (n, m) => `عند قراءة "${n}" في سياق التوافق، يظهر ${m}.`,
  professional: (n, m) => `في السياق المهني، يُظهر "${n}" ${m}.`,
  commercial: (n, m) => `في السياق التجاري، يوحي "${n}" ب${m}.`,
};

export class NarrativeWeaver {
  weave(analysis: AnalysisResult, mode: ContextMode): string {
    if (analysis.status !== 'full' || !analysis.layers) {
      return analysis.report;
    }

    const L: NameAnalysisLayers = analysis.layers;
    const pct = (analysis.confidence.overall * 100).toFixed(0);
    const element = L.element ?? '';
    const metaphor = ELEMENT_METAPHOR[element] ?? 'نمط متميز';

    const opening = MODE_OPENING[mode](analysis.name, metaphor);

    const layerBits: string[] = [];
    if (L.root) layerBits.push(humanizeLayer(L.root, 'root'));
    if (L.planet) layerBits.push(`الكوكب ${L.planet}`);
    if (L.sign) layerBits.push(`البرج ${L.sign}`);
    if (element) layerBits.push(`الطبع ${element}`);

    const body = layerBits.length > 0
      ? `تتشكل هذه القراءة من تقاطع: ${layerBits.join('، ')}.`
      : 'الطبقات المتاحة محدودة، لذا القراءة تقديرية.';

    const closing =
      'هذا تحليل نمطي لا حتمي، ويبقى الإنسان أكبر من أي نمط.';

    return [
      opening,
      '',
      body,
      '',
      `**درجة الثقة:** ${pct}% — ${analysis.confidence.level}`,
      '',
      closing,
    ].join('\n');
  }
}

export const narrativeWeaver = new NarrativeWeaver();
