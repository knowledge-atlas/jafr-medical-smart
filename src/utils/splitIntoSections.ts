export interface ReportSectionSplit {
  id: string;
  title: string;
  icon: string;
  content: string;
  defaultOpen?: boolean;
}

/**
 * يقسّم نص التقرير التقليدي إلى أقسام قابلة للطي
 * - يدعم 【 القسم ... 】
 * - يدعم "القسم الأول/الثاني/..."
 * - Fallback: قسم واحد كامل
 */
export function splitIntoSections(text: string): ReportSectionSplit[] {
  if (!text || text.trim().length === 0) {
    return [{
      id: 'sec_empty',
      title: 'التقرير',
      icon: '📄',
      content: '',
      defaultOpen: true,
    }];
  }

  // محاولة 1: 【 القسم ... 】
  const pattern1 = /【\s*القسم\s+([^】]+)\s*】/g;
  const matches1 = [...text.matchAll(pattern1)];

  if (matches1.length > 0) {
    const sections: ReportSectionSplit[] = [];
    for (let i = 0; i < matches1.length; i++) {
      const start = matches1[i].index!;
      const end = i + 1 < matches1.length ? matches1[i + 1].index! : text.length;
      const sectionText = text.slice(start, end).trim();
      const titleMatch = sectionText.match(/【\s*القسم\s+([^】]+)\s*】/);
      const title = titleMatch ? `القسم ${titleMatch[1]}` : `القسم ${i + 1}`;
      sections.push({
        id: `sec_${i}`,
        title,
        icon: pickIcon(title),
        content: sectionText,
        defaultOpen: i === 0,
      });
    }
    return sections;
  }

  // محاولة 2: القسم الأول/الثاني/...
  const parts = text.split(/(?=القسم\s+(?:الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|الحادي عشر|الثاني عشر))/g);
  if (parts.length > 1) {
    const result: ReportSectionSplit[] = [];
    parts.forEach((part, i) => {
      if (!part.trim()) return;
      const firstLine = part.split('\n')[0].trim();
      result.push({
        id: `sec_${i}`,
        title: firstLine.slice(0, 50) || `قسم ${i + 1}`,
        icon: pickIcon(firstLine),
        content: part.trim(),
        defaultOpen: i === 0,
      });
    });
    return result;
  }

  // Fallback
  return [{
    id: 'sec_all',
    title: 'التقرير الكامل',
    icon: '📜',
    content: text,
    defaultOpen: true,
  }];
}

export function pickIcon(title: string): string {
  if (/الملخص|التنفيذي/.test(title)) return '📋';
  if (/الجذر|الحقيقي/.test(title)) return '🌱';
  if (/الطبقة|الداخلية/.test(title)) return '🔥';
  if (/الخارجية/.test(title)) return '🌍';
  if (/المكتسب/.test(title)) return '✨';
  if (/البواقي|التفصيلية/.test(title)) return '🔢';
  if (/رنين/.test(title)) return '🎵';
  if (/التراكيب/.test(title)) return '🔗';
  if (/الوفق/.test(title)) return '⚖️';
  if (/التوصية|العامة/.test(title)) return '💡';
  if (/الطبية|الكاملة/.test(title)) return '🏥';
  if (/بيانات|السجل/.test(title)) return '📖';
  return '📄';
}
