import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { externalStorage, SourceInfo } from '../utils/externalStorage';
import { getExternalStats } from '../kb/importers/externalImporters';

const TYPE_LABELS: Record<string, string> = {
  root: '🌱 جذور',
  planet: '🪐 كواكب',
  sign: '♈ أبراج',
  house: '🏠 بيوت',
  element: '🔥 طبائع',
  letter: '🔤 حروف',
  remainder: '🔢 بواقي',
  compound: '⚗️ تراكيب',
  resonance: '🎵 رنين',
  medical: '⚕️ طبي',
  remedy: '💊 ترياق',
  wafq: '🔷 أوفاق',
  custom: '📦 مخصص',
};

function prettySourceName(sourceFile: string): string {
  if (sourceFile.startsWith('wiki:')) return `📖 ${sourceFile.replace('wiki:', 'Wikipedia: ')}`;
  if (sourceFile.startsWith('json:')) return `📊 ${sourceFile.replace('json:', 'JSON: ')}`;
  if (sourceFile.endsWith('.json')) return `📊 ${sourceFile}`;
  if (sourceFile.endsWith('.md')) return `📝 ${sourceFile}`;
  if (sourceFile.endsWith('.txt')) return `📄 ${sourceFile}`;
  return `📁 ${sourceFile}`;
}

export default function ExternalKnowledgeScreen({ navigation }: any) {
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [bundled, setBundled] = useState(getExternalStats());
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await externalStorage.listSources();
      setSources(list);
      setBundled(getExternalStats());
    } finally {
      setLoading(false);
    }
  }, []);

  // أعد التحميل كلما عاد المستخدم للشاشة
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const confirmDelete = (source: SourceInfo) => {
    Alert.alert(
      'حذف المصدر',
      `سيتم حذف ${source.count} كيان من "${source.sourceFile}". متابعة؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            const removed = await externalStorage.removeBySource(source.sourceFile);
            Alert.alert('✅ تم الحذف', `${removed} كيان محذوف`);
            await reload();
          },
        },
      ]
    );
  };

  const confirmClearAll = () => {
    Alert.alert(
      'حذف كل المصادر',
      `سيتم حذف جميع الشواهد المستوردة (${sources.reduce((s, x) => s + x.count, 0)} كيان). متابعة؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف الكل',
          style: 'destructive',
          onPress: async () => {
            await externalStorage.clear();
            externalStorage.invalidate();
            await reload();
          },
        },
      ]
    );
  };

  const totalUserEntities = sources.reduce((s, x) => s + x.count, 0);
  const totalChars = sources.reduce((s, x) => s + x.totalChars, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 الموسوعات الخارجية</Text>
        <Text style={styles.headerSubtitle}>
          {sources.length} مصدر · {totalUserEntities} كيان
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* زر الاستيراد */}
        <TouchableOpacity
          style={styles.importBtn}
          onPress={() => navigation.navigate('ImportExternal')}
        >
          <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
          <Text style={styles.importBtnText}> 📥 استيراد من الجهاز</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#d4af37" />
            <Text style={styles.loadingText}>جارٍ التحميل...</Text>
          </View>
        ) : sources.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>لا توجد مصادر مستوردة</Text>
            <Text style={styles.emptyBody}>
              استخدم زر الاستيراد أعلاه لإضافة موسوعات من جهازك
            </Text>
          </View>
        ) : (
          <>
            {/* ملخص */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNum}>{totalUserEntities}</Text>
              <Text style={styles.summaryLabel}>كيان مُستورد من جهازك</Text>
              <Text style={styles.summaryMeta}>
                {totalChars.toLocaleString()} حرف · {sources.length} مصدر
              </Text>
            </View>

            {/* قائمة المصادر */}
            <Text style={styles.sectionTitle}>المصادر المستوردة</Text>
            {sources.map((src) => (
              <View key={src.sourceFile} style={styles.sourceCard}>
                <View style={styles.sourceHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sourceName}>{prettySourceName(src.sourceFile)}</Text>
                    <Text style={styles.sourceMeta}>
                      {src.count} كيان · {src.totalChars.toLocaleString()} حرف
                    </Text>
                    <Text style={styles.sourceTypes}>
                      {src.entityTypes.map((t) => TYPE_LABELS[t] ?? t).join(' · ')}
                    </Text>
                    <Text style={styles.sourceDate}>
                      آخر استيراد: {new Date(src.lastImportedAt).toLocaleString('ar-EG')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => confirmDelete(src)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* زر حذف الكل */}
            <TouchableOpacity style={styles.clearAllBtn} onPress={confirmClearAll}>
              <Ionicons name="trash" size={18} color="#e74c3c" />
              <Text style={styles.clearAllText}> حذف كل المصادر</Text>
            </TouchableOpacity>
          </>
        )}

        {/* المدمجة في الـbundle */}
        {bundled.total > 0 && (
          <View style={styles.bundledBox}>
            <Text style={styles.bundledTitle}>📦 مدمج في الـbundle (لا يُحذف)</Text>
            <Text style={styles.bundledBody}>
              {bundled.total} كيان مُحمَّل من `src/data/external/entities.json`
            </Text>
            <Text style={styles.bundledHint}>
              هذا الملف يُدار عبر سكريبت `tools/knowledge-sync` من الكمبيوتر
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  header: { backgroundColor: '#1a3b5d', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: '#d4af37' },
  headerTitle: { color: '#d4af37', fontSize: 17, fontWeight: 'bold', textAlign: 'right', writingDirection: 'rtl' },
  headerSubtitle: { color: '#a0a0a0', fontSize: 11, marginTop: 3, textAlign: 'right', writingDirection: 'rtl' },

  scrollContent: { padding: 12, paddingBottom: 30 },

  importBtn: { flexDirection: 'row-reverse', backgroundColor: '#d4af37', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 14, gap: 8 },
  importBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

  loadingBox: { padding: 30, alignItems: 'center', gap: 10 },
  loadingText: { color: '#d4af37', fontSize: 13 },

  emptyBox: { padding: 40, alignItems: 'center', backgroundColor: '#0f2438', borderRadius: 12, borderWidth: 1, borderColor: '#2c5070' },
  emptyIcon: { fontSize: 50, marginBottom: 14 },
  emptyTitle: { color: '#d4af37', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  emptyBody: { color: '#a0a0a0', fontSize: 13, textAlign: 'center', writingDirection: 'rtl' },

  summaryCard: { backgroundColor: '#0f2438', borderWidth: 2, borderColor: '#d4af37', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 16 },
  summaryNum: { color: '#d4af37', fontSize: 40, fontWeight: 'bold' },
  summaryLabel: { color: '#a0a0a0', fontSize: 13, marginTop: 4 },
  summaryMeta: { color: '#666', fontSize: 11, marginTop: 8 },

  sectionTitle: { color: '#d4af37', fontSize: 13, fontWeight: 'bold', marginBottom: 8, textAlign: 'right', writingDirection: 'rtl' },

  sourceCard: { backgroundColor: '#0f2438', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2c5070' },
  sourceHeader: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10 },
  sourceName: { color: '#d4af37', fontSize: 14, fontWeight: 'bold', textAlign: 'right', writingDirection: 'rtl', marginBottom: 4 },
  sourceMeta: { color: '#e8e8e8', fontSize: 12, textAlign: 'right', writingDirection: 'rtl', marginBottom: 2 },
  sourceTypes: { color: '#a0a0a0', fontSize: 11, textAlign: 'right', writingDirection: 'rtl', marginBottom: 2 },
  sourceDate: { color: '#666', fontSize: 10, textAlign: 'right', writingDirection: 'rtl' },
  deleteBtn: { padding: 10, backgroundColor: '#2c1a1a', borderRadius: 8, borderWidth: 1, borderColor: '#e74c3c' },

  clearAllBtn: { flexDirection: 'row-reverse', backgroundColor: '#2c1a1a', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 8, borderWidth: 1, borderColor: '#e74c3c', gap: 6 },
  clearAllText: { color: '#e74c3c', fontSize: 14, fontWeight: 'bold' },

  bundledBox: { backgroundColor: '#1a3b5d', borderRadius: 10, padding: 14, marginTop: 20, borderWidth: 1, borderColor: '#2c5070' },
  bundledTitle: { color: '#3498db', fontSize: 13, fontWeight: 'bold', marginBottom: 6, textAlign: 'right', writingDirection: 'rtl' },
  bundledBody: { color: '#e8e8e8', fontSize: 12, textAlign: 'right', writingDirection: 'rtl', marginBottom: 4 },
  bundledHint: { color: '#666', fontSize: 10, textAlign: 'right', writingDirection: 'rtl' },
});
