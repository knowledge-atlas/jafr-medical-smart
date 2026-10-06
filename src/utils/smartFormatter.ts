// ═══════════════════════════════════════════════════════════
// smartFormatter — يكتشف النص المُنظَّم ويحوّله لجداول
// ═══════════════════════════════════════════════════════════
// الأنماط المدعومة:
//   1) "label: value" في سطر واحد
//   2) "label:" ثم السطر التالي value
//   3) "label\nvalue" (نمط فقرة بلا نقاط)
// ═══════════════════════════════════════════════════════════

export interface StructuredBlock {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface TextBlock {
  type: 'text';
  text: string;
}

export type FormattedPiece = StructuredBlock | TextBlock;

// ═══ هل السطر يشبه "label: value"؟ ═══
function isLabelLine(line: string): { label: string; value: string } | null {
  const trimmed = line.trim();
  if (trimmed.length < 3) return null;

  // مطابقة: شيء ثم نقطتان (عربي/إنجليزي) ثم الباقي
  const m = trimmed.match(/^([^:：]{2,60})[:：]\s*(.*)$/);
  if (!m) return null;

  const label = m[1].trim();
  const value = m[2].trim();

  // استثنِ العناوين الطويلة جداً أو التي تحوي جملة كاملة
  if (label.length > 60) return null;
  if (label.includes('،') && label.length > 40) return null;

  return { label, value };
}

// ═══ هل السطر عنوان جدول محتمل (ينتهي بـ :) فقط؟ ═══
function isHeaderOnly(line: string): string | null {
  const t = line.trim();
  if (t.length < 3 || t.length > 60) return null;
  if (!/[:：]\s*$/.test(t)) return null;
  return t.replace(/[:：]\s*$/, '').trim();
}

// ═══════════════════════════════════════════════════════════
// formatTextAsPieces — يقسم النص إلى مقاطع (جداول + نصوص)
// ═══════════════════════════════════════════════════════════
export function formatTextAsPieces(text: string): FormattedPiece[] {
  if (!text || text.trim().length === 0) return [];

  const lines = text.split('\n');
  const pieces: FormattedPiece[] = [];

  let i = 0;
  let textBuf: string[] = [];

  const flushText = () => {
    const joined = textBuf.join('\n').trim();
    if (joined) pieces.push({ type: 'text', text: joined });
    textBuf = [];
  };

  while (i < lines.length) {
    const line = lines[i];
    const labelInfo = isLabelLine(line);
    const headerOnly = isHeaderOnly(line);

    // ═══ الحالة 1: label: value ═══
    if (labelInfo && labelInfo.value) {
      const tableRows: [string, string][] = [[labelInfo.label, labelInfo.value]];
      let j = i + 1;

      while (j < lines.length) {
        const next = lines[j];
        const nextInfo = isLabelLine(next);
        if (nextInfo && nextInfo.value) {
          tableRows.push([nextInfo.label, nextInfo.value]);
          j++;
        } else if (isHeaderOnly(next)) {
          // سطر عنوان فقط متبوع بـ value
          const after = j + 1 < lines.length ? lines[j + 1].trim() : '';
          if (after && after.length >= 2 && !isLabelLine(after) && !isHeaderOnly(after)) {
            tableRows.push([isHeaderOnly(next)!, after]);
            j += 2;
          } else {
            break;
          }
        } else if (next.trim() === '') {
          // سطر فارغ — توقف إذا كان هناك فاصل
          if (j + 1 < lines.length && isLabelLine(lines[j + 1])) {
            j++;
            continue;
          }
          break;
        } else {
          break;
        }
      }

      // نحتاج على الأقل 2 صفوف لتحويله إلى جدول
      if (tableRows.length >= 2) {
        flushText();
        pieces.push({
          type: 'table',
          headers: ['العنصر', 'الوصف'],
          rows: tableRows,
        });
        i = j;
        continue;
      }
    }

    // ═══ الحالة 2: header only ثم value (جدول عمودين بلا نقاط) ═══
    if (headerOnly) {
      const after = i + 1 < lines.length ? lines[i + 1].trim() : '';
      if (after && after.length >= 2 && !isLabelLine(after) && !isHeaderOnly(after)) {
        const tableRows: [string, string][] = [[headerOnly, after]];
        let j = i + 2;

        while (j + 1 < lines.length) {
          const h = isHeaderOnly(lines[j]);
          const v = lines[j + 1].trim();
          if (h && v && !isLabelLine(v) && !isHeaderOnly(v)) {
            tableRows.push([h, v]);
            j += 2;
          } else {
            break;
          }
        }

        if (tableRows.length >= 2) {
          flushText();
          pieces.push({
            type: 'table',
            headers: ['العنصر', 'الوصف'],
            rows: tableRows,
          });
          i = j;
          continue;
        }
      }
    }

    textBuf.push(line);
    i++;
  }

  flushText();
  return pieces;
}

// ═══════════════════════════════════════════════════════════
// splitIntoTableBlocks — يبني ReportBlock[]
// ═══════════════════════════════════════════════════════════
export function splitIntoTableBlocks(text: string): any[] {
  const pieces = formatTextAsPieces(text);
  const out: any[] = [];

  for (const p of pieces) {
    if (p.type === 'table') {
      out.push({
        type: 'table',
        headers: p.headers,
        rows: p.rows,
      });
    } else {
      out.push({
        type: 'paragraph',
        text: p.text,
      });
    }
  }

  return out;
}
