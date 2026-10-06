// ═══════════════════════════════════════════════════════════
// Provenance — تتبع مصدر كل معلومة
// ═══════════════════════════════════════════════════════════

/**
 * مستويات الدليل — تصنيف صادق لنوع المعرفة
 * A: علمي (مُتحقَّق منه علمياً — نادر جداً في هذا النظام)
 * B: تاريخي (موثَّق في مصادر تاريخية)
 * C: تقليدي (نصوص الإمام البوني والمصادر التراثية)
 * D: رمزي (تفسير رمزي داخل النظام)
 * E: فرضي (فرضية قابلة للاختبار)
 */
export type EvidenceLevel = 'A' | 'B' | 'C' | 'D' | 'E';

export type SourceType = 'internal' | 'external' | 'user' | 'derived';

export interface ProvenanceRecord {
  /** مستوى الدليل */
  level: EvidenceLevel;

  /** معرّف فريد للمصدر */
  sourceId: string;

  /** اسم المصدر (يظهر للمستخدم) */
  sourceLabel: string;

  /** نوع المصدر */
  sourceType: SourceType;

  /** مرجع تفصيلي (URL، صفحة، سطر) */
  reference?: string;

  /** تاريخ الاستيراد (ISO) */
  importedAt?: string;

  /** بصمة النص الأصلي */
  hash?: string;
}

export interface ProvenanceProfile {
  level: EvidenceLevel;
  levelLabel: string;
  levelDescription: string;
  color: string;
  icon: string;
}

// ═══════════════════════════════════════════════════════════
// خريطة المستويات — للعرض
// ═══════════════════════════════════════════════════════════
export const EVIDENCE_LEVELS: Record<EvidenceLevel, ProvenanceProfile> = {
  A: {
    level: 'A',
    levelLabel: 'علمي',
    levelDescription: 'مُتحقَّق منه علمياً',
    color: '#2ecc71',
    icon: '🔬',
  },
  B: {
    level: 'B',
    levelLabel: 'تاريخي',
    levelDescription: 'موثَّق في مصادر تاريخية',
    color: '#3498db',
    icon: '📜',
  },
  C: {
    level: 'C',
    levelLabel: 'تراثي',
    levelDescription: 'منصوص في مصادر تراثية (البوني)',
    color: '#d4af37',
    icon: '📖',
  },
  D: {
    level: 'D',
    levelLabel: 'رمزي',
    levelDescription: 'تفسير رمزي داخل النظام',
    color: '#9b59b6',
    icon: '🔮',
  },
  E: {
    level: 'E',
    levelLabel: 'فرضي',
    levelDescription: 'فرضية قابلة للاختبار',
    color: '#e67e22',
    icon: '💡',
  },
};
