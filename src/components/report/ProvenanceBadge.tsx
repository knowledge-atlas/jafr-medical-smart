import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EvidenceLevel, EVIDENCE_LEVELS } from '../../domain/provenance/types';

interface Props {
  level: EvidenceLevel;
  compact?: boolean;
}

export default function ProvenanceBadge({ level, compact = false }: Props) {
  const p = EVIDENCE_LEVELS[level];
  if (!p) return null;

  return (
    <View style={[styles.badge, { borderColor: p.color }, compact && styles.compact]}>
      <Text style={[styles.icon, { color: p.color }]}>{p.icon}</Text>
      <Text style={[styles.label, { color: p.color }]}>{p.levelLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    gap: 3,
  },
  compact: {
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  icon: { fontSize: 10 },
  label: { fontSize: 9, fontWeight: 'bold' },
});
