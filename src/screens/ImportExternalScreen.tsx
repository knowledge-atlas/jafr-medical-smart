import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import { Ionicons } from '@expo/vector-icons';
import { autoParse } from '../utils/deviceImporter';
import { externalStorage, UserEntity } from '../utils/externalStorage';

export default function ImportExternalScreen({ navigation }: any) {
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<UserEntity[]>([]);
  const [sourceName, setSourceName] = useState<string>('');
  const [format, setFormat] = useState<'json' | 'text' | ''>('');
  const [error, setError] = useState<string | null>(null);

  const pickFile = async () => {
    setError(null);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', 'text/*', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (res.canceled || !res.assets?.[0]) return;

      const asset = res.assets[0];
      setBusy(true);
      setSourceName(asset.name ?? 'ملف');

      // قراءة عبر fetch (يعمل في Expo Go)
      let content = '';
      try {
        const resp = await fetch(asset.uri);
        content = await resp.text();
      } catch (fetchErr: any) {
        // fallback: حاول عبر FileSystem القديم
        try {
          const FS: any = require('expo-file-system');
          if (FS?.readAsStringAsync) {
            content = await FS.readAsStringAsync(asset.uri, { encoding: 'utf8' });
          } else {
            throw new Error('لا يمكن قراءة الملف');
          }
        } catch {
          throw new Error(`فشل قراءة الملف: ${fetchErr?.message ?? 'unknown'}`);
        }
      }

      if (!content || content.length < 10) {
        throw new Error('الملف فارغ أو صغير جداً');
      }

      const parsed = autoParse(content, asset.name ?? 'ملف');
      setPending(parsed.entities);
      setFormat(parsed.format);

      if (parsed.entities.length === 0) {
        setError('لم يتم العثور على كيانات صالحة في الملف');
      }
    } catch (e: any) {
      setError(e?.message ?? 'فشل قراءة الملف');
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (pending.length === 0) return;
    setBusy(true);
    try {
      const added = await externalStorage.addMany(pending);
      externalStorage.invalidate();
      Alert.alert(
        '✅ تم الحفظ',
        `تمت إضافة ${added} كيان جديد من "${sourceName}"`,
        [{ text: 'حسناً', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert('خطأ', e?.message ?? 'فشل الحفظ');
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    setPending([]);
    setSourceName('');
    setFormat('');
    setError(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📥 استيراد موسوعة خارجية</Text>
        <Text style={styles.headerSubtitle}>
          اختر ملف JSON أو TXT من جهازك
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {pending.length === 0 ? (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroIcon}>📂</Text>
              <Text style={styles.heroTitle}>اختر ملفاً</Text>
              <Text style={styles.heroBody}>
                يدعم JSON (منظم) أو TXT (نص حر). سيتم تحليل الملف تلقائياً
                وتخزين الكيانات محلياً.
              </Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={pickFile}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="folder-open-outline" size={20} color="#fff" />
                    <Text style={styles.primaryBtnText}>  اختيار ملف</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>ℹ️ تنسيقات مدعومة</Text>

              <Text style={styles.infoSubtitle}>JSON:</Text>
              <View style={styles.codeBox}>
                <Text style={styles.code}>{`{
  "entities": [
    {
      "entityType": "medical",
      "titleAr": "الطب النبوي",
      "fullText": "نص كامل...",
      "keywords": ["طب", "نبوي", "الجذر 2", "قمر"]
    }
  ]
}`}</Text>
              </View>

              <Text style={styles.infoSubtitle}>TXT:</Text>
              <Text style={styles.infoText}>
                نص حر — سيُقسَّم إلى فقرات تلقائياً،
                وكل فقرة تُحفظ ككيان مستقل.
              </Text>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}
          </>
        ) : (
          <>
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>✅ تم التحليل</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>الملف:</Text>
                <Text style={styles.previewValue}>{sourceName}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>التنسيق:</Text>
                <Text style={styles.previewValue}>
                  {format === 'json' ? 'JSON منظم' : 'نص حر'}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>عدد الكيانات:</Text>
                <Text style={[styles.previewValue, { color: '#2ecc71', fontWeight: 'bold' }]}>
                  {pending.length}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>معاينة (أول 5)</Text>
            {pending.slice(0, 5).map((e, i) => (
              <View key={e.id} style={styles.itemCard}>
                <Text style={styles.itemNum}>{i + 1}.</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{e.titleAr}</Text>
                  <Text style={styles.itemMeta}>
                    {e.entityType} · {e.fullText.length} حرف · {e.keywords.length} كلمة
                  </Text>
                </View>
              </View>
            ))}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.saveBtnText}> حفظ {pending.length} كيان</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={cancel} disabled={busy}>
                <Ionicons name="close-circle-outline" size={20} color="#e74c3c" />
                <Text style={styles.cancelBtnText}> إلغاء</Text>
              </TouchableOpacity>
            </View>
          </>
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

  scrollContent: { padding: 12 },

  heroCard: { backgroundColor: '#0f2438', borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#2c5070', marginBottom: 14 },
  heroIcon: { fontSize: 60, marginBottom: 14 },
  heroTitle: { color: '#d4af37', fontSize: 18, fontWeight: 'bold', marginBottom: 8, writingDirection: 'rtl' },
  heroBody: { color: '#e8e8e8', fontSize: 13, lineHeight: 22, textAlign: 'center', writingDirection: 'rtl', marginBottom: 20 },

  primaryBtn: { flexDirection: 'row-reverse', backgroundColor: '#d4af37', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 30, alignItems: 'center', justifyContent: 'center', gap: 8, minWidth: 200 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

  infoCard: { backgroundColor: '#0f2438', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2c5070', marginBottom: 14 },
  infoTitle: { color: '#d4af37', fontSize: 14, fontWeight: 'bold', marginBottom: 10, textAlign: 'right', writingDirection: 'rtl' },
  infoSubtitle: { color: '#a0a0a0', fontSize: 12, marginTop: 8, marginBottom: 6, textAlign: 'right', writingDirection: 'rtl' },
  infoText: { color: '#e8e8e8', fontSize: 12, lineHeight: 20, textAlign: 'right', writingDirection: 'rtl' },
  codeBox: { backgroundColor: '#0a1628', borderRadius: 6, padding: 10, borderWidth: 1, borderColor: '#2c5070' },
  code: { color: '#f39c12', fontSize: 10, fontFamily: 'monospace', textAlign: 'left' },

  errorBox: { backgroundColor: '#2c1a1a', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#e74c3c' },
  errorText: { color: '#e74c3c', fontSize: 12, textAlign: 'right', writingDirection: 'rtl' },

  previewCard: { backgroundColor: '#0f2438', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#2ecc71', marginBottom: 14 },
  previewTitle: { color: '#2ecc71', fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'right', writingDirection: 'rtl' },
  previewRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 4 },
  previewLabel: { color: '#a0a0a0', fontSize: 12 },
  previewValue: { color: '#e8e8e8', fontSize: 12 },

  sectionTitle: { color: '#d4af37', fontSize: 13, fontWeight: 'bold', marginBottom: 8, textAlign: 'right', writingDirection: 'rtl' },
  itemCard: { flexDirection: 'row-reverse', backgroundColor: '#0f2438', borderRadius: 8, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: '#2c5070', gap: 8, alignItems: 'center' },
  itemNum: { color: '#d4af37', fontSize: 14, fontWeight: 'bold' },
  itemTitle: { color: '#e8e8e8', fontSize: 13, textAlign: 'right', writingDirection: 'rtl', fontWeight: 'bold' },
  itemMeta: { color: '#666', fontSize: 10, textAlign: 'right', marginTop: 2 },

  actions: { gap: 10, marginTop: 10 },
  saveBtn: { flexDirection: 'row-reverse', backgroundColor: '#27ae60', paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  cancelBtn: { flexDirection: 'row-reverse', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e74c3c', gap: 6 },
  cancelBtnText: { color: '#e74c3c', fontSize: 14, fontWeight: 'bold' },
});
