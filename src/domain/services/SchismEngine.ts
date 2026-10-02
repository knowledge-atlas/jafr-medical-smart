/**
 * SchismEngine — محرك الانشقاق البنيوي
 * يقيس التناغم/الصراع بين الطبقات الداخلية (الجذر، الطبع، الكوكب، البرج).
 * يكشف "الفجوة" بين ما يريده الجوهر وما يظهره السلوك.
 */

export interface LayerElement {
  layer: 'root' | 'sign' | 'planet';
  element: string;
  source: string;
}

export type SchismVerdict = 'منسجم' | 'توتّر طفيف' | 'صراع بنيوي';

export interface SchismResult {
  coherence: number;
  verdict: SchismVerdict;
  layers: LayerElement[];
  dominantElement: string;
  missingElement: string;
  pairs: Array<{ a: string; b: string; score: number }>;
  narrative: string;
  remedy: string;
}

const SIGN_ELEMENTS: Record<string, string> = {
  'الحمل': 'ناري', 'الثور': 'ترابي', 'الجوزاء': 'هوائي', 'السرطان': 'مائي',
  'الأسد': 'ناري', 'العذراء': 'ترابي', 'الميزان': 'هوائي', 'العقرب': 'مائي',
  'القوس': 'ناري', 'الجدي': 'ترابي', 'الدلو': 'هوائي', 'الحوت': 'مائي',
};

const PLANET_ELEMENTS: Record<string, string> = {
  'شمس': 'ناري', 'قمر': 'مائي', 'عطارد': 'هوائي', 'زهرة': 'ترابي',
  'مريخ': 'ناري', 'مشتري': 'ناري', 'زحل': 'ترابي',
  'أورانوس': 'هوائي', 'نبتون': 'مائي', 'بلوتو': 'مائي',
};

const COMPATIBILITY: Record<string, Record<string, number>> = {
  'ناري': { 'ناري': 1.0, 'هوائي': 0.9, 'ترابي': 0.5, 'مائي': 0.3 },
  'هوائي': { 'ناري': 0.9, 'هوائي': 1.0, 'ترابي': 0.4, 'مائي': 0.5 },
  'ترابي': { 'ناري': 0.5, 'هوائي': 0.4, 'ترابي': 1.0, 'مائي': 0.9 },
  'مائي': { 'ناري': 0.3, 'هوائي': 0.5, 'ترابي': 0.9, 'مائي': 1.0 },
};

const OPPOSITE: Record<string, string> = {
  'ناري': 'مائي', 'مائي': 'ناري',
  'ترابي': 'هوائي', 'هوائي': 'ترابي',
};

const REMEDIES_BY_MISSING: Record<string, string> = {
  'مائي': 'أضف بعداً عاطفياً: 20 دقيقة تأمل، مذكرة مشاعر، تواصل مع صديق موثوق.',
  'ناري': 'أضف جرأة وإقداماً: خطوة واحدة نحو ما تخاف منه، أسبوعياً.',
  'ترابي': 'أضف ثباتاً: روتين يومي ثابت، ميزانية، التزام صغير لـ 30 يوماً.',
  'هوائي': 'أضف تواصلاً: تعلم مهارة جديدة، وسّع شبكتك الاجتماعية، اكتب يومياً.',
};

export interface SchismInput {
  root?: string;
  planet?: string;
  sign?: string;
  element?: string;
}

export class SchismEngine {
  private extractElement(source: string, layer: 'sign' | 'planet'): string | null {
    const cleaned = source.replace(/^ال/, '').trim();
    if (layer === 'sign') {
      for (const [k, v] of Object.entries(SIGN_ELEMENTS)) {
        if (source.includes(k) || cleaned.includes(k.replace(/^ال/, ''))) return v;
      }
      return null;
    }
    const p = cleaned.toLowerCase();
    for (const [k, v] of Object.entries(PLANET_ELEMENTS)) {
      if (p.includes(k) || source.includes(k)) return v;
    }
    return null;
  }

  evaluate(input: SchismInput): SchismResult {
    const layers: LayerElement[] = [];

    if (input.element) {
      layers.push({ layer: 'root', element: input.element, source: `الجذر ${input.root ?? ''}` });
    }
    if (input.sign) {
      const el = this.extractElement(input.sign, 'sign');
      if (el) layers.push({ layer: 'sign', element: el, source: input.sign });
    }
    if (input.planet) {
      const el = this.extractElement(input.planet, 'planet');
      if (el) layers.push({ layer: 'planet', element: el, source: input.planet });
    }

    if (layers.length < 2) {
      return this.buildDefault(layers);
    }

    const pairs: Array<{ a: string; b: string; score: number }> = [];
    let totalScore = 0;
    let pairCount = 0;

    for (let i = 0; i < layers.length; i++) {
      for (let j = i + 1; j < layers.length; j++) {
        const a = layers[i].element;
        const b = layers[j].element;
        const score = COMPATIBILITY[a]?.[b] ?? 0.5;
        pairs.push({ a, b, score });
        totalScore += score;
        pairCount++;
      }
    }

    const coherence = pairCount > 0 ? totalScore / pairCount : 0.5;

    const frequency: Record<string, number> = {};
    for (const l of layers) frequency[l.element] = (frequency[l.element] ?? 0) + 1;
    const dominantElement = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0][0];
    const missingElement = OPPOSITE[dominantElement];

    const verdict = this.verdictOf(coherence);
    const narrative = this.narrativeOf(verdict, dominantElement, missingElement, coherence);
    const remedy = REMEDIES_BY_MISSING[missingElement] ?? 'وازن بين الطبائع بتأمل أسبوعي.';

    return {
      coherence,
      verdict,
      layers,
      dominantElement,
      missingElement,
      pairs,
      narrative,
      remedy,
    };
  }

  private buildDefault(layers: LayerElement[]): SchismResult {
    return {
      coherence: 0.5,
      verdict: 'توتّر طفيف',
      layers,
      dominantElement: layers[0]?.element ?? '—',
      missingElement: layers[0] ? OPPOSITE[layers[0].element] : '—',
      pairs: [],
      narrative: 'بيانات الطبقات محدودة، التقييم تقديري.',
      remedy: 'أكمل البيانات للحصول على تحليل أدق.',
    };
  }

  private verdictOf(coherence: number): SchismVerdict {
    if (coherence >= 0.8) return 'منسجم';
    if (coherence >= 0.55) return 'توتّر طفيف';
    return 'صراع بنيوي';
  }

  private narrativeOf(
    verdict: SchismVerdict,
    dominant: string,
    missing: string,
    coherence: number
  ): string {
    const pct = (coherence * 100).toFixed(0);
    if (verdict === 'منسجم') {
      return `الطبقات منسجمة (${pct}%). الطبع **${dominant}** يوحّد الجوهر والسلوك والمحيط — لديك تماسك داخلي قوي.`;
    }
    if (verdict === 'توتّر طفيف') {
      return `توتّر طفيف (${pct}%). الطبع الغالب **${dominant}** يواجه صعوبة في الانسجام الكامل مع بقية الطبقات. إضافة الطبع **${missing}** يعيد التوازن.`;
    }
    return `صراع بنيوي (${pct}%). طبقاتك في تنافر عميق: **${dominant}** يسيطر بينما **${missing}** غائب تماماً. هذا يخلق "انشقاقاً" بين ما تريده وما تظهره. توازنك يستدعي إدماج **${missing}** بوعي.`;
  }
}

export const schismEngine = new SchismEngine();
