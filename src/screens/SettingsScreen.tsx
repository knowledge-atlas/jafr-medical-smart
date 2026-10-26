// ================================================================
// شاشة الإعدادات — إدارة LLM ومفاتيح API + إعادة بناء KB + Demo Mode
// ================================================================

import { freeTrial } from '../monetization/freeTrial';
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { llmBridge } from '../ai';
import { consentStorage } from '../utils/consentStorage';
import { KnowledgeBase, importAll } from '../kb';

import { errorLogger } from '../utils/errorLogger';
import { externalStorage } from '../utils/externalStorage';
import { reportsStorage } from '../storage/reportsStorage';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

type Provider = 'none' | 'demo' | 'gemini' | 'openai';

export default function SettingsScreen({ navigation }: any) {
  const [provider, setProvider] = useState<Provider>('none');
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  const loadSettings = async () => {
    const p = await llmBridge.getProvider();
    setProvider(p as Provider);
    const gk = await llmBridge.getApiKey('gemini');
    const ok = await llmBridge.getApiKey('openai');
    if (gk) setGeminiKey('••••••••' + gk.slice(-6));
    if (ok) setOpenaiKey('••••••••' + ok.slice(-6));
  };

  const loadStats = () => {
    const s = KnowledgeBase.stats();
    setStats(s);
  };

  // ⭐ إعادة بناء قاعدة المعرفة
  const rebuildKB = () => {
    Alert.alert(
      '🔄 إعادة بناء قاعدة المعرفة',
      'سيتم مسح كل الفهارس وإعادة استيرادها من الصفر، بما في ذلك العلاقات.\n\nهل تريد المتابعة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إعادة البناء',
          style: 'destructive',
          onPress: async () => {
            setRebuilding(true);
            try {
              await KnowledgeBase.reset();
              await importAll();
              loadStats();
              Alert.alert('✅ نجاح', 'تم إعادة بناء قاعدة المعرفة بنجاح');
            } catch (e: any) {
              Alert.alert('❌ خطأ', e?.message || 'فشل إعادة البناء');
            } finally {
              setRebuilding(false);
            }
          },
        },
      ]
    );
  };

  // تفعيل الوضع التجريبي
  const enableDemo = async () => {
    await llmBridge.setProvider('demo');
    setProvider('demo');
    Alert.alert('✅ الوضع التجريبي', 'لن تحتاج مفتاح API. اذهب لتبويب المساعد وجرّب أي سؤال.');
  };

  // تعطيل AI
  const disableAI = async () => {
    await llmBridge.setProvider('none');
    setProvider('none');
    Alert.alert('✅', 'تم تعطيل الذكاء الاصطناعي — التطبيق يعمل محلياً');
  };

    const resetConsent = async () => {
    Alert.alert(
      'إعادة تعيين الموافقة',
      'ستُطلب الموافقة مرة أخرى عند إعادة فتح التطبيق.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إعادة تعيين',
          style: 'destructive',
          onPress: async () => {
            await consentStorage.reset();
            Alert.alert('✅', 'تم. أعد فتح التطبيق لرؤية شاشة الموافقة.');
          },
        },
      ]
    );
  };

const saveKey = async (which: 'gemini' | 'openai') => {
    const key = which === 'gemini' ? geminiKey : openaiKey;
    if (!key || key.startsWith('••')) {
      Alert.alert('تنبيه', 'الرجاء إدخال مفتاح صالح');
      return;
    }
    await llmBridge.saveApiKey(which, key);
    await llmBridge.setProvider(which);
    setProvider(which);
    Alert.alert('✅', `تم حفظ مفتاح ${which === 'gemini' ? 'Gemini' : 'OpenAI'}`);
  };

  const removeKey = async (which: 'gemini' | 'openai') => {
    Alert.alert('حذف المفتاح', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          await llmBridge.deleteApiKey(which);
          if (which === 'gemini') setGeminiKey('');
          else setOpenaiKey('');
          if (provider === which) {
            await llmBridge.setProvider('none');
            setProvider('none');
          }
          Alert.alert('✅', 'تم الحذف');
        },
      },
    ]);
  };

  const testConnection = async (which: 'gemini' | 'openai') => {
    setTesting(true);
    const result = await llmBridge.testConnection(which);
    setTesting(false);
    Alert.alert(result.ok ? '✅' : '❌', result.message);
  };


  const handleDeleteAllData = () => {
    Alert.alert(
      '⚠️ حذف جميع البيانات',
      'سيتم حذف:\n\n• جميع التقارير المحفوظة\n• مفاتيح API\n• المصادر الخارجية\n• سجل الأخطاء\n\n(لن تُحذف: الموافقة، وعداد التجربة المجانية)\n\nهل أنت متأكد؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف نهائي',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1) حذف التقارير
              try {
                await (reportsStorage as any).clear?.() ?? (reportsStorage as any).clearAll?.() ?? Promise.resolve();
              } catch {}

              // 2) حذف المصادر الخارجية
              await externalStorage.clear();

              // 3) حذف سجل الأخطاء
              await errorLogger.clear();

              // 4) حذف مفاتيح API من SecureStore
              try {
                await SecureStore.deleteItemAsync('gemini_api_key');
                await SecureStore.deleteItemAsync('openai_api_key');
                await SecureStore.deleteItemAsync('llm_provider');
              } catch {}

              Alert.alert('✅', 'تم حذف جميع البيانات بنجاح');
            } catch (e: any) {
              Alert.alert('خطأ', e?.message ?? 'فشل الحذف');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>

      {/* ═══ قاعدة المعرفة ═══ */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📚 قاعدة المعرفة</Text>
        {stats && (
          <>
            <Text style={styles.statLine}>إجمالي الكيانات: {stats.totalEntities}</Text>
            <Text style={styles.statLine}>إجمالي العلاقات: {stats.totalRelations}</Text>
            <Text style={styles.statLine}>
              آخر تحديث: {new Date(stats.indexedAt).toLocaleDateString('ar')}
            </Text>
            <Text style={styles.statLine}>
              الحالة: {stats.totalEntities > 0 ? '🟢 جاهزة' : '🟡 فارغة'}
            </Text>
          </>
        )}

        <TouchableOpacity
          style={[styles.rebuildBtn, rebuilding && { opacity: 0.6 }]}
          onPress={rebuildKB}
          disabled={rebuilding}
        >
          {rebuilding ? (
            <>
              <ActivityIndicator color="#0a1628" />
              <Text style={styles.rebuildBtnText}>  جارٍ إعادة البناء...</Text>
            </>
          ) : (
            <Text style={styles.rebuildBtnText}>🔄 إعادة بناء الفهارس</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ═══ وضع الذكاء الاصطناعي ═══ */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🤖 الذكاء الاصطناعي (اختياري)</Text>
        <Text style={styles.description}>
          التطبيق يعمل بدون إنترنت افتراضياً. لتفعيل AI، إمّا أن تجرّب الوضع التجريبي،
          أو تضيف مفتاح API حقيقي.
          {'\n'}المفاتيح تُخزّن مشفّرة على جهازك فقط.
        </Text>

        <View style={styles.providerRow}>
          <Text style={styles.providerLabel}>الوضع الحالي:</Text>
          <Text style={[styles.providerValue, provider !== 'none' && styles.providerActive]}>
            {provider === 'none'
              ? '🔒 محلي فقط'
              : provider === 'demo'
              ? '🧪 وضع تجريبي'
              : provider === 'gemini'
              ? '🌐 Gemini'
              : '🌐 OpenAI'}
          </Text>
        </View>

        {/* أزرار التحكم بالوضع */}
        <View style={styles.modeButtons}>
          <TouchableOpacity
            style={[styles.modeBtn, provider === 'demo' && styles.modeBtnActive]}
            onPress={enableDemo}
          >
            <Text style={styles.modeBtnText}>🧪 تجريبي (بدون مفتاح)</Text>
          </TouchableOpacity>

          {provider !== 'none' && (
            <TouchableOpacity
              style={[styles.modeBtn, styles.modeBtnDanger]}
              onPress={disableAI}
            >
              <Text style={styles.modeBtnDangerText}>🚫 تعطيل AI</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ═══ Gemini ═══ */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔷 Google Gemini (موصى به - مجاني)</Text>
        <Text style={styles.link}>https://aistudio.google.com/app/apikey</Text>
        <TextInput
          style={styles.input}
          value={geminiKey}
          onChangeText={setGeminiKey}
          placeholder="الصق مفتاح API هنا"
          placeholderTextColor="#666"
          autoCapitalize="none"
        />
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => saveKey('gemini')}>
            <Text style={styles.primaryBtnText}>حفظ وتفعيل</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => testConnection('gemini')}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator color="#d4af37" />
            ) : (
              <Text style={styles.secondaryBtnText}>اختبار</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerBtn} onPress={() => removeKey('gemini')}>
            <Text style={styles.dangerBtnText}>حذف</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ═══ OpenAI ═══ */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔶 OpenAI GPT (مدفوع)</Text>
        <Text style={styles.link}>https://platform.openai.com/api-keys</Text>
        <TextInput
          style={styles.input}
          value={openaiKey}
          onChangeText={setOpenaiKey}
          placeholder="الصق مفتاح API هنا"
          placeholderTextColor="#666"
          autoCapitalize="none"
        />
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => saveKey('openai')}>
            <Text style={styles.primaryBtnText}>حفظ وتفعيل</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => testConnection('openai')}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator color="#d4af37" />
            ) : (
              <Text style={styles.secondaryBtnText}>اختبار</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerBtn} onPress={() => removeKey('openai')}>
            <Text style={styles.dangerBtnText}>حذف</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ═══ حول التطبيق ═══ */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ℹ️ حول التطبيق</Text>
        <Text style={styles.description}>
          الجفر التراثي الذكي — الإصدار 1.0.0{'\n'}
          محرك استدلال معرفي مبني على قاعدة بيانات داخلية.{'\n'}
          جميع النصوص الأصلية محفوظة كاملة بدون تعديل.{'\n'}
          المصادر مفصولة: 🟢 داخلية | 🟡 خارجية.
        </Text>
      </View>
    
        <TouchableOpacity
          style={{ flexDirection: 'row-reverse', padding: 14, marginHorizontal: 10, marginVertical: 6, backgroundColor: '#0f2438', borderRadius: 10, borderWidth: 1, borderColor: '#2c5070', alignItems: 'center', justifyContent: 'space-between' }}
          onPress={() => navigation.navigate('Health')}
        >
          <Text style={{ color: '#d4af37', fontSize: 15, fontWeight: 'bold', writingDirection: 'rtl' }}>📊 صحة التطبيق</Text>
          <Text style={{ color: '#666', fontSize: 18 }}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flexDirection: 'row-reverse', padding: 14, marginHorizontal: 10, marginVertical: 6, backgroundColor: '#0f2438', borderRadius: 10, borderWidth: 1, borderColor: '#2c5070', alignItems: 'center', justifyContent: 'space-between' }}
          onPress={() => navigation.navigate('ExternalKnowledge')}
        >
          <Text style={{ color: '#d4af37', fontSize: 15, fontWeight: 'bold', writingDirection: 'rtl' }}>📚 المعرفة الخارجية</Text>
          <Text style={{ color: '#666', fontSize: 18 }}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flexDirection: 'row-reverse', padding: 14, marginHorizontal: 10, marginVertical: 6, backgroundColor: '#2c1a1a', borderRadius: 10, borderWidth: 1, borderColor: '#e74c3c', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onPress={async () => {
            await freeTrial.reset();
            alert('✅ تم إعادة تعيين التجربة المجانية');
          }}
        >
          <Text style={{ color: '#e74c3c', fontSize: 14, fontWeight: 'bold' }}>🔄 إعادة تعيين التجربة (للمطورين)</Text>
        </TouchableOpacity>

        {/* ═══ Danger Zone — حذف البيانات ═══ */}
        <View style={{ marginHorizontal: 10, marginTop: 24, marginBottom: 12 }}>
          <Text style={{ color: '#e74c3c', fontSize: 12, fontWeight: 'bold', marginBottom: 8, textAlign: 'right', writingDirection: 'rtl' }}>
            🗑️ منطقة الخطر
          </Text>
          <TouchableOpacity
            style={{
              flexDirection: 'row-reverse',
              padding: 14,
              backgroundColor: '#2c1a1a',
              borderRadius: 10,
              borderWidth: 2,
              borderColor: '#e74c3c',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onPress={handleDeleteAllData}
          >
            <Ionicons name="trash" size={18} color="#e74c3c" />
            <Text style={{ color: '#e74c3c', fontSize: 14, fontWeight: 'bold' }}>
              حذف جميع بياناتي نهائياً
            </Text>
          </TouchableOpacity>
          <Text style={{ color: '#666', fontSize: 10, marginTop: 6, textAlign: 'right', writingDirection: 'rtl' }}>
            يحذف: التقارير، المفاتيح، المصادر، سجل الأخطاء فقط
          </Text>
        </View>

</ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', padding: 12 },
  card: {
    backgroundColor: '#1a3b5d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { color: '#d4af37', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  description: { color: '#c0c0c0', fontSize: 13, lineHeight: 20 },
  statLine: { color: '#e8e8e8', fontSize: 13, marginVertical: 2 },
  link: { color: '#1abc9c', fontSize: 12, marginVertical: 6 },
  input: {
    backgroundColor: '#0f2438',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginTop: 8,
  },
  btnRow: { flexDirection: 'row', marginTop: 10, gap: 8 },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#d4af37',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#0a1628', fontWeight: 'bold' },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d4af37',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  secondaryBtnText: { color: '#d4af37', fontWeight: 'bold' },
  dangerBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e74c3c',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  dangerBtnText: { color: '#e74c3c', fontWeight: 'bold' },
  providerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  providerLabel: { color: '#c0c0c0', fontSize: 14 },
  providerValue: { color: '#888', fontSize: 14, fontWeight: 'bold' },
  providerActive: { color: '#1abc9c' },
  modeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    minWidth: 140,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1abc9c',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#1abc9c',
  },
  modeBtnText: { color: '#1abc9c', fontWeight: 'bold', fontSize: 13 },
  modeBtnDanger: {
    borderColor: '#e74c3c',
  },
  modeBtnDangerText: { color: '#e74c3c', fontWeight: 'bold', fontSize: 13 },
  disableBtn: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  disableBtnText: { color: '#fff', fontWeight: 'bold' },
  rebuildBtn: {
    backgroundColor: '#1abc9c',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  rebuildBtnText: { color: '#0a1628', fontWeight: 'bold', fontSize: 15 },
});
