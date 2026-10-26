import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ReportBlock } from '../../utils/reportBlocksParser';
import ProvenanceBadge from './ProvenanceBadge';
import type { EvidenceLevel } from '../../domain/provenance/types';

// ═══════════════════════════════════════════════════════════
// Strip Markdown bold/italic markers — لأن BlockRenderer لا يفهمها
// ═══════════════════════════════════════════════════════════
function stripMd(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold** → bold
    .replace(/\*(.+?)\*/g, '$1')          // *italic* → italic
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1');
}


interface Props {
  block: ReportBlock;
  index: number;
}

// ═══════════════════════════════════════════════════════════
// RTL مضمَّن — لا يعتمد على I18nManager
// row-reverse دائماً = عناصر من اليمين لليسار
// ═══════════════════════════════════════════════════════════
const RTL = 'row-reverse' as const;

export default function BlockRenderer({ block }: Props) {
  switch (block.type) {
    case 'heading':      return <HeadingBlock block={block} />;
    case 'subheading':   return <SubheadingBlock block={block} />;
    case 'paragraph':    return <ParagraphBlock block={block} />;
    case 'table':        return <TableBlock block={block} />;
    case 'box':          return <BoxBlock block={block} />;
    case 'quote':        return <QuoteBlock block={block} />;
    case 'bullets':      return <BulletsBlock block={block} />;
    case 'magicSquare':  return <MagicSquareBlock block={block} />;
      return null; // hidden per user request
    default:             return null;
  }
}

function HeadingBlock({ block }: { block: Extract<ReportBlock, { type: 'heading' }> }) {
  const sizeMap = { 1: 22, 2: 18, 3: 15 };
  return (
    <View style={[styles.heading, { marginTop: block.level === 1 ? 20 : 14 }]}>
      <Text style={[
        styles.headingText,
        { fontSize: sizeMap[block.level] },
        block.level === 1 && styles.heading1,
        block.level === 3 && styles.heading3,
      ]}>
        {stripMd(block.text)}
      </Text>
    </View>
  );
}

function SubheadingBlock({ block }: { block: Extract<ReportBlock, { type: 'subheading' }> }) {
  return (
    <View style={styles.subheadingWrapper}>
      <View style={styles.subheadingAccent} />
      <Text style={styles.subheadingText}>{stripMd(block.text)}</Text>
    </View>
  );
}

function ParagraphBlock({ block }: { block: Extract<ReportBlock, { type: 'paragraph' }> }) {
  return (
    <View style={styles.paragraphWrapper}>
      <Text style={styles.paragraph}>{stripMd(block.text)}</Text>
    </View>
  );
}

function TableBlock({ block }: { block: Extract<ReportBlock, { type: 'table' }> }) {
  const colCount = Math.max(block.headers.length, 1);

  const getFlex = (index: number): number => {
    if (colCount === 2) return index === 0 ? 1 : 2.5;
    if (colCount === 3) return index === 0 ? 1 : 1.5;
    return 1;
  };

  return (
    <View style={styles.tableWrapper}>
      <View style={styles.table}>
        {/* Header */}
        <View style={[styles.tableRow, styles.tableHeaderRow]}>
          {block.headers.map((h, i) => (
            <View
              key={i}
              style={[styles.tableCell, styles.tableHeaderCell, { flex: getFlex(i) }]}
            >
              <Text style={styles.tableHeaderText}>{stripMd(h)}</Text>
            </View>
          ))}
        </View>
        {/* Body */}
        {block.rows.map((row, ri) => (
          <View
            key={ri}
            style={[styles.tableRow, ri % 2 === 1 && styles.tableRowAlternate]}
          >
            {row.map((cell, ci) => (
              <View key={ci} style={[styles.tableCell, { flex: getFlex(ci) }]}>
                <Text style={styles.tableCellText}>{stripMd(cell)}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function BoxBlock({ block }: { block: Extract<ReportBlock, { type: 'box' }> }) {
  return (
    <View style={styles.box}>
      {block.title && (
        <View style={styles.boxHeader}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flex: 1 }}>
            {(block as any).evidenceLevel ? (
              <ProvenanceBadge level={(block as any).evidenceLevel as EvidenceLevel} compact />
            ) : null}
            <Text style={styles.boxTitle}>{stripMd(block.title)}</Text>
          </View>
        </View>
      )}
      {block.rows.map(([key, value], i) => (
        <View key={i} style={[styles.boxRow, i % 2 === 1 && styles.boxRowAlt]}>
          {key ? (
            <>
              <Text style={styles.boxKey}>{stripMd(key)}</Text>
              <Text style={styles.boxValue}>{stripMd(value)}</Text>
            </>
          ) : (
            <Text style={styles.boxValueFull}>{stripMd(value)}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

function QuoteBlock({ block }: { block: Extract<ReportBlock, { type: 'quote' }> }) {
  return (
    <View style={styles.quote}>
      <View style={styles.quoteBar} />
      <Text style={styles.quoteText}>{stripMd(block.text)}</Text>
    </View>
  );
}

function BulletsBlock({ block }: { block: Extract<ReportBlock, { type: 'bullets' }> }) {
  return (
    <View style={styles.bulletsWrapper}>
      {block.items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>{stripMd(item)}</Text>
        </View>
      ))}
    </View>
  );
}

function MagicSquareBlock({ block }: { block: Extract<ReportBlock, { type: 'magicSquare' }> }) {
  return (
    <View style={styles.magicWrapper}>
      <Text style={styles.magicTitle}>⚖️ الوفق البسيط — المربع السحري</Text>
      <View style={styles.magicSquare}>
        {block.grid.map((row, ri) => (
          <View key={ri} style={styles.magicRow}>
            {row.map((num, ci) => (
              <View key={ci} style={styles.magicCell}>
                <Text style={styles.magicText}>{num}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
      <Text style={styles.magicNote}>كل صف وعمود وقطر = 15</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  separator: { height: 1, backgroundColor: '#2c5070', marginVertical: 12 },

  // Heading
  heading: { marginBottom: 6, width: '100%' },
  headingText: {
    color: '#d4af37', fontWeight: 'bold',
    textAlign: 'right', writingDirection: 'rtl',
  },
  heading1: { fontSize: 22, borderBottomWidth: 2, borderBottomColor: '#d4af37', paddingBottom: 6 },
  heading3: { color: '#f0e0a0', fontSize: 15 },

  // Subheading
  subheadingWrapper: {
    marginTop: 14, marginBottom: 6,
    flexDirection: RTL, alignItems: 'center', width: '100%',
  },
  subheadingAccent: {
    width: 4, height: 22, backgroundColor: '#d4af37',
    borderRadius: 2, marginLeft: 8,
  },
  subheadingText: {
    flex: 1, color: '#d4af37', fontSize: 15, fontWeight: 'bold',
    textAlign: 'right', writingDirection: 'rtl',
  },

  // Paragraph
  paragraphWrapper: { marginBottom: 10 },
  paragraph: {
    color: '#e8e8e8', fontSize: 15, lineHeight: 26,
    textAlign: 'right', writingDirection: 'rtl',
  },

  // Table
  tableWrapper: { marginVertical: 10, width: '100%' },
  table: {
    borderWidth: 1, borderColor: '#d4af37', borderRadius: 8,
    overflow: 'hidden', backgroundColor: '#0a1628', width: '100%',
  },
  tableRow: {
    flexDirection: RTL,     // ← row-reverse ثابت
    borderBottomWidth: 1, borderBottomColor: '#2c5070', alignItems: 'stretch',
  },
  tableRowAlternate: { backgroundColor: '#0f2438' },
  tableHeaderRow: { backgroundColor: '#1a3b5d' },
  tableCell: {
    paddingVertical: 10, paddingHorizontal: 8,
    borderLeftWidth: 1, borderLeftColor: '#2c5070',
    justifyContent: 'center', minWidth: 0, flexShrink: 1,
  },
  tableHeaderCell: { backgroundColor: '#1a3b5d' },
  tableHeaderText: {
    color: '#d4af37', fontWeight: 'bold', fontSize: 12,
    textAlign: 'right', writingDirection: 'rtl',
  },
  tableCellText: {
    color: '#e8e8e8', fontSize: 12, lineHeight: 20,
    textAlign: 'right', writingDirection: 'rtl', flexWrap: 'wrap',
  },

  // Box
  box: {
    backgroundColor: '#0a1628', borderWidth: 1, borderColor: '#d4af37',
    borderRadius: 10, marginVertical: 8, overflow: 'hidden', width: '100%',
  },
  boxHeader: {
    backgroundColor: '#1a3b5d', paddingVertical: 8, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: '#d4af37',
  },
  boxTitle: {
    color: '#d4af37', fontWeight: 'bold', fontSize: 14,
    textAlign: 'right', writingDirection: 'rtl',
  },
  boxRow: {
    flexDirection: RTL,     // ← row-reverse
    paddingVertical: 8, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: '#2c5070',
  },
  boxRowAlt: { backgroundColor: '#0f2438' },
  boxKey: {
    color: '#d4af37', fontSize: 13, fontWeight: 'bold',
    minWidth: 90, textAlign: 'right', writingDirection: 'rtl', marginLeft: 8,
  },
  boxValue: {
    flex: 1, color: '#e8e8e8', fontSize: 13, lineHeight: 20,
    textAlign: 'right', writingDirection: 'rtl',
  },
  boxValueFull: {
    flex: 1, color: '#e8e8e8', fontSize: 13,
    textAlign: 'right', writingDirection: 'rtl',
  },

  // Quote
  quote: {
    flexDirection: RTL,     // ← row-reverse
    marginVertical: 10, backgroundColor: '#1a3b5d',
    borderRadius: 8, overflow: 'hidden', width: '100%',
  },
  quoteBar: { width: 4, backgroundColor: '#d4af37' },
  quoteText: {
    flex: 1, color: '#e8e8e8', fontStyle: 'italic',
    fontSize: 14, lineHeight: 24, padding: 12,
    textAlign: 'right', writingDirection: 'rtl',
  },

  // Bullets
  bulletsWrapper: { marginVertical: 8 },
  bulletRow: {
    flexDirection: RTL,     // ← row-reverse
    alignItems: 'flex-start', marginVertical: 6,
    paddingHorizontal: 4, width: '100%',
  },
  bulletDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#d4af37', marginTop: 8, marginLeft: 8,
  },
  bulletText: {
    flex: 1, color: '#e8e8e8', fontSize: 14, lineHeight: 24,
    textAlign: 'right', writingDirection: 'rtl', flexWrap: 'wrap',
  },

  // Magic Square — LTR دائماً
  magicWrapper: {
    alignItems: 'center', marginVertical: 16, padding: 16,
    backgroundColor: '#1a3b5d', borderRadius: 12,
  },
  magicTitle: {
    color: '#d4af37', fontSize: 16, fontWeight: 'bold',
    marginBottom: 12, writingDirection: 'rtl',
  },
  magicSquare: {
    borderWidth: 2, borderColor: '#d4af37', borderRadius: 8,
    padding: 4, backgroundColor: '#0a1628',
  },
  magicRow: { flexDirection: 'row' },   // ← LTR لأن المربع رقمي
  magicCell: {
    width: 60, height: 60, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#2c5070', margin: 2, borderRadius: 6,
  },
  magicText: { color: '#d4af37', fontSize: 24, fontWeight: 'bold' },
  magicNote: {
    color: '#a0a0a0', fontSize: 12, marginTop: 10, writingDirection: 'rtl',
  },
});
