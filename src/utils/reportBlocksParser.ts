/**
 * يحوّل نص التقرير التقليدي الخام إلى بلوكات منظمة
 */

export type ReportBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string; icon?: string }
  | { type: 'paragraph'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'box'; title?: string; rows: Array<[string, string]> }
  | { type: 'quote'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'magicSquare'; grid: number[][] }
  | { type: 'separator' };

export interface ReportSection {
  id: string;
  title: string;
  icon: string;
  blocks: ReportBlock[];
}

function extractIcon(title: string): string {
  if (/الملخص|التنفيذي/.test(title)) return '📋';
  if (/الجذر|الحقيقي/.test(title)) return '🌱';
  if (/الداخلية/.test(title)) return '🔥';
  if (/الخارجية/.test(title)) return '🌍';
  if (/المكتسب/.test(title)) return '✨';
  if (/البواقي/.test(title)) return '🔢';
  if (/الميزان|الوفق/.test(title)) return '⚖️';
  if (/التوصية/.test(title)) return '💡';
  if (/الطبية/.test(title)) return '🏥';
  if (/رنين/.test(title)) return '🎵';
  return '📄';
}

export function parseReportToBlocks(text: string): ReportSection[] {
  if (!text) return [];

  // تقسيم بحسب 【 القسم ... 】
  const sectionPattern = /【\s*القسم\s+([^】]+)\s*】/g;
  const matches = [...text.matchAll(sectionPattern)];

  if (matches.length === 0) {
    return [{
      id: 'sec_all',
      title: 'التقرير الكامل',
      icon: '📜',
      blocks: parseBlocksFromText(text),
    }];
  }

  const sections: ReportSection[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index!;
    const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    const sectionText = text.slice(start, end).trim();
    const titleMatch = sectionText.match(/【\s*القسم\s+([^】]+)\s*】/);
    const title = titleMatch ? `القسم ${titleMatch[1]}` : `القسم ${i + 1}`;
    const body = sectionText.replace(/【[^】]+】/, '').trim();

    sections.push({
      id: `sec_${i}`,
      title,
      icon: extractIcon(title),
      blocks: parseBlocksFromText(body),
    });
  }

  return sections;
}

function parseBlocksFromText(text: string): ReportBlock[] {
  const blocks: ReportBlock[] = [];
  const lines = text.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // تخطي الفواصل الزخرفية
    if (/^[━═─]{5,}$/.test(trimmed)) {
      i++;
      continue;
    }
    if (trimmed.length === 0) {
      i++;
      continue;
    }

    // ═══ Box ═══
    if (trimmed.startsWith('╭')) {
      const boxResult = parseBox(lines, i);
      if (boxResult) {
        blocks.push(boxResult.block);
        i = boxResult.nextIndex;
        continue;
      }
    }

    // ═══ Table ═══
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableResult = parseTable(lines, i);
      if (tableResult) {
        blocks.push(tableResult.block);
        i = tableResult.nextIndex;
        continue;
      }
    }

    // ═══ Magic Square (ASCII box) ═══
    if (trimmed.includes('┌') && trimmed.includes('┐')) {
      const magicResult = parseMagicSquare(lines, i);
      if (magicResult) {
        blocks.push(magicResult.block);
        i = magicResult.nextIndex;
        continue;
      }
    }

    // ═══ Quote ═══
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
        i++;
      }
      blocks.push({ type: 'quote', text: quoteLines.join('\n') });
      continue;
    }

    // ═══ Heading (with #) ═══
    if (/^#{1,3}\s/.test(trimmed)) {
      const level = (trimmed.match(/^#+/) || ['#'])[0].length as 1 | 2 | 3;
      blocks.push({
        type: 'heading',
        level: Math.min(level, 3) as 1 | 2 | 3,
        text: trimmed.replace(/^#+\s*/, ''),
      });
      i++;
      continue;
    }

    // ═══ Bullets ═══
    if (/^[•\-\*]\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[•\-\*]\s/.test(lines[i])) {
        items.push(lines[i].trim().replace(/^[•\-\*]\s*/, ''));
        i++;
      }
      blocks.push({ type: 'bullets', items });
      continue;
    }

    // ═══ Heading detection (Arabic section markers) ═══
    if (/^(◈|━)\s*/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
      blocks.push({
        type: 'heading',
        level: 3,
        text: trimmed.replace(/^[◈━]\s*/, ''),
      });
      i++;
      continue;
    }

    // ═══ Paragraph ═══
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim().length > 0 &&
      !/^[━═─╭╰│├┌┐└┘|>•\-\*#]/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
    } else {
      i++;
    }
  }

  return blocks;
}

function parseBox(lines: string[], startIndex: number): { block: ReportBlock; nextIndex: number } | null {
  const rows: Array<[string, string]> = [];
  let title: string | undefined;
  let i = startIndex + 1;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.startsWith('╰')) {
      i++;
      break;
    }
    if (line.startsWith('├')) {
      i++;
      continue;
    }
    if (line.startsWith('│')) {
      const content = line.replace(/^│\s*/, '').replace(/\s*│$/, '').trim();
      if (content.length > 0) {
        // نتحقق إذا كان سطر "title"
        if (!title && !content.includes(':') && rows.length === 0) {
          title = content;
        } else {
          // فصل المفتاح: القيمة
          const colonIndex = content.indexOf(':');
          if (colonIndex > 0) {
            const key = content.slice(0, colonIndex).trim();
            const value = content.slice(colonIndex + 1).trim();
            rows.push([key, value]);
          } else {
            rows.push(['', content]);
          }
        }
      }
    }
    i++;
  }

  return {
    block: { type: 'box', title, rows },
    nextIndex: i,
  };
}

function parseTable(lines: string[], startIndex: number): { block: ReportBlock; nextIndex: number } | null {
  const rows: string[][] = [];
  let i = startIndex;

  while (i < lines.length && lines[i].trim().startsWith('|')) {
    const line = lines[i].trim();
    // تجاهل خط الفاصل |---|---|
    if (/^\|[\s\-:|]+\|$/.test(line)) {
      i++;
      continue;
    }
    const cells = line
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim());
    rows.push(cells);
    i++;
  }

  if (rows.length === 0) return null;

  const headers = rows[0];
  const dataRows = rows.slice(1);

  return {
    block: { type: 'table', headers, rows: dataRows },
    nextIndex: i,
  };
}

function parseMagicSquare(lines: string[], startIndex: number): { block: ReportBlock; nextIndex: number } | null {
  // نحاول استخراج الأرقام من المربع
  const grid: number[][] = [];
  let i = startIndex;

  while (i < lines.length && i < startIndex + 15) {
    const line = lines[i];
    const nums = line.match(/\d+/g);
    if (nums && nums.length >= 3) {
      const rowNums = nums.slice(0, 3).map((n) => parseInt(n, 10));
      grid.push(rowNums);
    }
    if (line.includes('└')) {
      i++;
      break;
    }
    i++;
  }

  if (grid.length !== 3) return null;
  return { block: { type: 'magicSquare', grid }, nextIndex: i };
}
