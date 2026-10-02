import { AnalysisResult } from '../application/use-cases/AnalyzeNameUseCase';
import { ContextMode } from './ContextAwarePrompter';

function extractNumber(id?: string): number | null {
  if (!id) return null;
  const m = id.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

const ELEMENT_METAPHOR: Record<string, string> = {
  ناري: 'شعلة تتوق للحركة والوضوح',
  ترابي: 'جذر راسخ يبني على المدى الطويل',
  هوائي: 'نسمة تبحث عن التواصل والتبادل',
  مائي: 'نهر عميق يقرأ ما وراء الظاهر',
};

export class NarrativeWeaver {
  weave(analysis: AnalysisResult, mode: ContextMode): string {
    if (analysis.status !== 'full' || !analysis.layers) {
      return analysis.report;
    }

    const L = analysis.layers;
    const rootNum = extractNumber(L.root);
    const planetNum = extractNumber(L.planet);
    const signNum = extractNumber(L.sign);
    const pct = (analysis.confidence.overall * 100).toFixed(0);

    const element = L.element ?? '';
    const metaphor = ELEMENT_METAPHOR[element] ?? 'نمط متميز';

    const intro =
      mode === 'personal'
        ? `اسم "${analysis.name}" يحمل في طبعه ${metaphor}.`
        : mode === 'marital'
        ? `عند قراءة "${analysis.name}" في سياق التوافق، يظهر ${metaphor}.`
        : mode === 'professional'
        ? `في السياق المهني، يُظهر "${analysis.name}" ${metaphor}.`
        : `في السياق التجاري، يوحي "${analysis.name}" ب${metaphor}.`;

    const layersLine = [
      rootNum !== null ? `الجذر ${rootNum}` : null,
      planetNum !== null ? `الكوكب ${planetNum}` : null,
      signNum !== null ? `البرج ${signNum}` : null,
      element ? `الطبع ${element}` : null,
    ]
      .filter(Boolean)
      .join('، ');

    const body = layersLine
      ? `تتشكل هذه القراءة من تقاطع: ${layersLine}.`
      : 'الطبقات المتاحة محدودة، لذا القراءة تقديرية.';

    const closing =
      'هذا تحليل نمطي لا حتمي، ويبقى الإنسان أكبر من أي نمط.';

    return [
      `# تحليل ${analysis.name}`,
      '',
      intro,
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
