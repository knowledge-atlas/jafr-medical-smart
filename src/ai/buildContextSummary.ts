import { analyzeName } from '../application/di';

export function buildContextSummary(name: string): string | null {
  try {
    const analysis = analyzeName.execute({ name });
    if (analysis.status === 'abstained') return null;

    const L = (analysis as any).layers ?? (analysis as any);
    const parts: string[] = [];

    if (L.root !== undefined) parts.push(`الجذر ${L.root}`);
    if (L.planet) parts.push(`الكوكب ${L.planet}`);
    if (L.sign) parts.push(`البرج ${L.sign}`);
    if (L.element) parts.push(`الطبع ${L.element}`);
    if (L.house !== undefined) parts.push(`البيت ${L.house}`);

    if (parts.length === 0) return null;

    // اقرأ أول 3 أسطر من التقرير إن وُجد
    const report = (analysis as any).report ?? '';
    const header = report.split('\n').slice(0, 3).join(' ').trim();

    return `- ${parts.join(' · ')}\n${header ? `- ملاحظة: ${header.slice(0, 200)}` : ''}`;
  } catch {
    return null;
  }
}
