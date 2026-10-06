import { EvidenceLevel, ProvenanceRecord, ProvenanceProfile, EVIDENCE_LEVELS } from './types';

// ═══════════════════════════════════════════════════════════
// ProvenanceEngine — يدير تتبع مصادر المعرفة
// ═══════════════════════════════════════════════════════════
class ProvenanceEngine {
  private records: Map<string, ProvenanceRecord> = new Map();

  /** سجّل مصدراً لكيان */
  register(entityId: string, record: ProvenanceRecord): void {
    this.records.set(entityId, record);
  }

  /** اقرأ مصدر كيان */
  get(entityId: string): ProvenanceRecord | null {
    return this.records.get(entityId) ?? null;
  }

  /** اقرأ الملف التعريفي لمستوى الدليل */
  profile(level: EvidenceLevel): ProvenanceProfile {
    return EVIDENCE_LEVELS[level];
  }

  /** ابنِ شارة عرض نصية */
  badge(level: EvidenceLevel): string {
    const p = EVIDENCE_LEVELS[level];
    return `${p.icon} ${p.levelLabel}`;
  }

  /** صنّف مصدراً تلقائياً */
  classify(sourceType: 'internal' | 'external' | 'user' | 'derived'): EvidenceLevel {
    switch (sourceType) {
      case 'internal':
        return 'C'; // البوني ومصادرنا التراثية
      case 'external':
        return 'B'; // Wikipedia ومصادر خارجية موثَّقة
      case 'user':
        return 'C'; // ملفات المستخدم — تُعامل كتراثية
      case 'derived':
        return 'D'; // مخرجات محركاتنا (تحليل، رنين)
    }
  }

  /** مسح */
  clear(): void {
    this.records.clear();
  }

  /** إحصاء */
  stats(): Record<EvidenceLevel, number> {
    const out: Record<EvidenceLevel, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    for (const r of this.records.values()) {
      out[r.level] += 1;
    }
    return out;
  }
}

export const provenanceEngine = new ProvenanceEngine();
