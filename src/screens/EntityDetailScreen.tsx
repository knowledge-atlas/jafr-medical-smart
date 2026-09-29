import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { KnowledgeBase } from '../kb';

export default function EntityDetailScreen({ route, navigation }: any) {
  const { entityId } = route.params;
  const entity = KnowledgeBase.getEntity(entityId);

  if (!entity) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠️ الكيان غير موجود</Text>
      </View>
    );
  }

  const relations = KnowledgeBase.getRelations(entityId);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(entity.fullText);
    alert('✅ تم نسخ النص الكامل');
  };

  const shareEntity = async () => {
    await Share.share({
      message: `📖 ${entity.titleAr}\n\n${entity.fullText.substring(0, 1000)}...`,
      title: entity.titleAr,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.typeBadge}>{entity.entityType}</Text>
        {entity.entityNumber && (
          <Text style={styles.numberBadge}>#{entity.entityNumber}</Text>
        )}
      </View>

      <Text style={styles.title}>{entity.titleAr || entity.title}</Text>

      <View style={styles.sourceCard}>
        <Text style={styles.sourceLabel}>المصدر:</Text>
        <Text style={styles.sourceValue}>
          {entity.sourceType === 'internal' ? '🟢 داخلي' : '🟡 خارجي'} • {entity.sourceFile}
        </Text>
      </View>

      {/* أزرار الإجراءات */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.copyBtn]} onPress={copyToClipboard}>
          <Text style={styles.actionBtnText}>📋 نسخ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.shareBtn]} onPress={shareEntity}>
          <Text style={styles.actionBtnText}>🔗 مشاركة</Text>
        </TouchableOpacity>
      </View>

      {/* النص الكامل */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📝 النص الكامل</Text>
        <Text style={styles.fullText} selectable>{entity.fullText}</Text>
      </View>

      {/* الكلمات المفتاحية */}
      {entity.keywords && entity.keywords.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🔑 كلمات مفتاحية</Text>
          <View style={styles.keywordsRow}>
            {entity.keywords.map((kw, i) => (
              <View key={i} style={styles.keywordChip}>
                <Text style={styles.keywordText}>{kw}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* العلاقات */}
      {relations.from.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🔗 علاقات صادرة ({relations.from.length})</Text>
          {relations.from.map((r, i) => (
            <Text key={i} style={styles.relationText}>
              → {r.relationType} → {r.targetEntityId}
            </Text>
          ))}
        </View>
      )}

      {relations.to.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>⬅️ علاقات واردة ({relations.to.length})</Text>
          {relations.to.map((r, i) => (
            <Text key={i} style={styles.relationText}>
              {r.sourceEntityId} → {r.relationType}
            </Text>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>🔙 العودة</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: '#f0f4f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, color: '#e74c3c' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  typeBadge: {
    backgroundColor: '#1a3b5d',
    color: '#d4af37',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    fontSize: 12,
    fontWeight: 'bold',
  },
  numberBadge: {
    backgroundColor: '#d4af37',
    color: '#1a3b5d',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a3b5d',
    marginBottom: 15,
    textAlign: 'right',
  },
  sourceCard: {
    backgroundColor: '#ecf0f1',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  sourceLabel: { fontSize: 11, color: '#7f8c8d', marginBottom: 3, textAlign: 'right' },
  sourceValue: { fontSize: 12, color: '#2c3e50', textAlign: 'right' },
  actionsRow: { flexDirection: 'row', marginBottom: 12 },
  actionBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  copyBtn: { backgroundColor: '#2980b9' },
  shareBtn: { backgroundColor: '#8e44ad' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a3b5d',
    marginBottom: 10,
    textAlign: 'right',
  },
  fullText: {
    fontSize: 14,
    lineHeight: 24,
    color: '#2c3e50',
    textAlign: 'right',
  },
  keywordsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  keywordChip: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    margin: 3,
  },
  keywordText: { color: '#1a3b5d', fontSize: 11, fontWeight: 'bold' },
  relationText: { fontSize: 13, color: '#34495e', marginBottom: 4, textAlign: 'right' },
  backBtn: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  backBtnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
});
