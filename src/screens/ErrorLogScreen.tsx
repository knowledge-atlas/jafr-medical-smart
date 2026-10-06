import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { errorLogger, LoggedError } from '../utils/errorLogger';

export default function ErrorLogScreen({ navigation }: any) {
  const [errors, setErrors] = useState<LoggedError[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadErrors();
  }, []);

  const loadErrors = async () => {
    const list = await errorLogger.getAll();
    setErrors(list);
    setLoading(false);
  };

  const copyAll = async () => {
    const text = errors.map((e) =>
      `[${e.ts}]\n${e.message}\n${e.stack ?? ''}\n${e.componentStack ?? ''}\n---`
    ).join('\n\n');
    await Clipboard.setStringAsync(text);
    Alert.alert('✅', `تم نسخ ${errors.length} خطأ`);
  };

  const shareAll = async () => {
    const text = errors.map((e) => `[${e.ts}] ${e.message}`).join('\n');
    try {
      await Share.share({ message: text, title: 'سجل الأخطاء' });
    } catch (e: any) {
      Alert.alert('خطأ', e?.message ?? 'فشل');
    }
  };

  const clearAll = () => {
    Alert.alert('حذف كل السجل', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          await errorLogger.clear();
          setErrors([]);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔴 سجل الأخطاء</Text>
        <Text style={styles.headerSubtitle}>{errors.length} خطأ مسجَّل</Text>
      </View>

      {errors.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyText}>لا توجد أخطاء مسجَّلة</Text>
          <Text style={styles.emptyHint}>التطبيق يعمل بشكل مستقر</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {errors.map((e) => (
            <View key={e.id} style={styles.card}>
              <Text style={styles.ts}>{new Date(e.ts).toLocaleString('ar-EG')}</Text>
              <Text style={styles.msg}>{e.message}</Text>
              {e.componentStack ? (
                <Text style={styles.stack} numberOfLines={4}>{e.componentStack.slice(0, 300)}</Text>
              ) : null}
            </View>
          ))}
        </ScrollView>
      )}

      {errors.length > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#3498db' }]} onPress={copyAll}>
            <Ionicons name="copy-outline" size={18} color="#fff" />
            <Text style={styles.btnText}> نسخ الكل</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#27ae60' }]} onPress={shareAll}>
            <Ionicons name="share-outline" size={18} color="#fff" />
            <Text style={styles.btnText}> مشاركة</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#e74c3c' }]} onPress={clearAll}>
            <Ionicons name="trash-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  header: { backgroundColor: '#1a3b5d', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: '#e74c3c' },
  headerTitle: { color: '#e74c3c', fontSize: 17, fontWeight: 'bold', textAlign: 'right', writingDirection: 'rtl' },
  headerSubtitle: { color: '#a0a0a0', fontSize: 11, marginTop: 3, textAlign: 'right', writingDirection: 'rtl' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyText: { color: '#2ecc71', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  emptyHint: { color: '#666', fontSize: 13 },

  scrollContent: { padding: 10 },
  card: { backgroundColor: '#0f2438', borderRadius: 8, borderWidth: 1, borderColor: '#2c5070', padding: 12, marginBottom: 10 },
  ts: { color: '#666', fontSize: 10, textAlign: 'right', marginBottom: 6 },
  msg: { color: '#e74c3c', fontSize: 13, fontWeight: 'bold', textAlign: 'right', marginBottom: 6, writingDirection: 'rtl' },
  stack: { color: '#888', fontSize: 10, fontFamily: 'monospace', textAlign: 'left' },

  bottomBar: { flexDirection: 'row', gap: 8, padding: 10, backgroundColor: '#0f2438', borderTopWidth: 1, borderTopColor: '#1a3b5d' },
  btn: { flex: 1, flexDirection: 'row-reverse', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
