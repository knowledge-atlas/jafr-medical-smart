import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, Switch, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AIProvider, AI_DISCLOSURE, getAIStatus, setAIEnabled, setAIProvider, saveAIKey, deleteAIKeys, testAIConnection,
} from '../services/AIIntegration';
import { clearAllUserData } from '../services/dataManager';
import Constants from 'expo-constants';
import { usePremium } from '../context/PremiumContext';

const PROVIDERS: { id: AIProvider; label: string }[] = [
  { id: 'gemini', label: 'Gemini' },
  { id: 'openai', label: 'OpenAI' },
];

export default function SettingsScreen(_props: any) {
  const { setPremium } = usePremium();
  const [tapCount, setTapCount] = useState(0);
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [provider, setProvider] = useState<AIProvider>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [busy, setBusy] = useState<null | 'save' | 'test' | 'delete'>(null);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const refresh = useCallback(async () => {
    const s = await getAIStatus();
    setEnabled(s.enabled);
    setHasKey(s.hasKey);
    if (s.provider) setProvider(s.provider);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return;
    setBusy('save');
    try {
      await saveAIKey(provider, apiKey);
      setApiKey('');
      setHasKey(true);
      setTestMsg(null);
      Alert.alert('تم الحفظ', 'حُفظ المفتاح مشفّراً على جهازك فقط.');
    } catch (e: any) {
      Alert.alert('تعذر الحفظ', e?.message === 'صيغة المفتاح غير صحيحة' ? e.message : 'حدث خطأ أثناء الحفظ');
    } finally {
      setBusy(null);
    }
  };

  const handleToggle = (value: boolean) => {
    if (!value) {
      setAIEnabled(false).then(refresh);
      return;
    }
    if (!hasKey) {
      Alert.alert('أضف مفتاحاً أولاً', 'احفظ مفتاح API الخاص بك ثم فعّل الميزة.');
      return;
    }
    Alert.alert(
      'تفعيل الذكاء الاصطناعي',
      'عند التفعيل تُرسَل عناوين المحاور ومستوياتها فقط (دون اسمك) إلى المزود الذي اخترته لتوليد تأمل إضافي. يمكنك الإيقاف في أي وقت. المتابعة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تفعيل',
          onPress: async () => {
            await setAIProvider(provider);
            await setAIEnabled(true);
            refresh();
          },
        },
      ],
    );
  };

  const handleTest = async () => {
    setBusy('test');
    await setAIProvider(provider);
    const r = await testAIConnection();
    setTestMsg({ ok: r.ok, text: r.message });
    setBusy(null);
  };

  const handleDeleteKey = () => {
    Alert.alert('حذف المفتاح', 'سيتوقف الذكاء الاصطناعي ويعمل التطبيق بالمحرك المحلي فقط.', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          setBusy('delete');
          await deleteAIKeys();
          setTestMsg(null);
          await refresh();
          setBusy(null);
        },
      },
    ]);
  };


  const handleVersionTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount >= 7) {
      setShowSecretInput(true);
      setTapCount(0);
      Alert.alert('وضع المطور', 'تم تفعيل حقل الرمز السري');
    }
  };

  const verifySecretCode = () => {
    const expectedCode = Constants.expoConfig?.extra?.developerUnlockCode;
    if (inputCode === expectedCode) {
      setPremium(true);
      Alert.alert('نجاح 🎉', 'تم فتح جميع الميزات المدفوعة بنجاح.');
      setShowSecretInput(false);
      setInputCode('');
    } else {
      Alert.alert('خطأ ❌', 'الرمز السري غير صحيح.');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'حذف جميع البيانات',
      'سيُحذف كل ما حفظه التطبيق على جهازك: التقارير والسجل والإعدادات ومفاتيح الذكاء الاصطناعي. لا يمكن التراجع عن ذلك.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف نهائياً',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllUserData();
              await refresh();
              Alert.alert('تم الحذف', 'حُذفت بياناتك من الجهاز. أعد فتح التطبيق لبدء جديد.');
            } catch {
              Alert.alert('تعذر الحذف', 'حدث خطأ. حاول مرة أخرى.');
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles-outline" size={20} color="#d4af37" />
          <Text style={styles.cardTitle}>الذكاء الاصطناعي (اختياري)</Text>
        </View>
        <Text style={styles.note}>
          يعمل التطبيق كاملاً دون إنترنت بمحركه المحلي. تفعيل الذكاء الاصطناعي يضيف تأملاً إضافياً فقط،
          ولا يُرسَل اسمك ولا أي نص شخصي.
        </Text>

        <View style={styles.switchRow}>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ false: '#2c5070', true: '#b8962e' }}
            thumbColor={enabled ? '#d4af37' : '#9fb0c3'}
          />
          <Text style={styles.label}>{enabled ? 'مفعّل' : 'معطّل'}</Text>
        </View>

        <Text style={styles.label}>المزوّد</Text>
        <View style={styles.row}>
          {PROVIDERS.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.providerBtn, provider === p.id && styles.providerActive]}
              onPress={() => setProvider(p.id)}
              accessibilityRole="button"
            >
              <Text style={[styles.providerText, provider === p.id && styles.providerTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>مفتاح API {hasKey ? '(محفوظ ✓)' : ''}</Text>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="الصق المفتاح هنا"
          placeholderTextColor="#667788"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveKey} disabled={busy !== null}>
          {busy === 'save' ? <ActivityIndicator color="#0a192f" /> : <Text style={styles.saveBtnText}>حفظ المفتاح</Text>}
        </TouchableOpacity>

        {hasKey && (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.ghostBtn} onPress={handleTest} disabled={busy !== null}>
              {busy === 'test' ? <ActivityIndicator color="#d4af37" /> : <Text style={styles.ghostText}>اختبار الاتصال</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostBtn} onPress={handleDeleteKey} disabled={busy !== null}>
              <Text style={[styles.ghostText, { color: '#e74c3c' }]}>حذف المفتاح</Text>
            </TouchableOpacity>
          </View>
        )}
        {testMsg && <Text style={[styles.testMsg, { color: testMsg.ok ? '#2ecc71' : '#e74c3c' }]}>{testMsg.text}</Text>}

        <View style={styles.disclosure}>
          <Ionicons name="information-circle-outline" size={18} color="#d4af37" />
          <Text style={styles.disclosureText}>{AI_DISCLOSURE}</Text>
        </View>
      </View>

      <View style={[styles.card, styles.dangerCard]}>
        <View style={styles.titleRow}>
          <Ionicons name="warning-outline" size={20} color="#e74c3c" />
          <Text style={[styles.cardTitle, { color: '#e74c3c' }]}>منطقة الخطر</Text>
        </View>
        <Text style={styles.note}>حذف كل بياناتك المحفوظة على هذا الجهاز نهائياً.</Text>
        <TouchableOpacity style={styles.dangerBtn} onPress={handleClearData} accessibilityRole="button">
          <Ionicons name="trash-outline" size={20} color="#e74c3c" />
          <Text style={styles.dangerText}>حذف جميع البيانات</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleVersionTap} activeOpacity={0.8} style={{ marginTop: 30, paddingBottom: 20 }}>
        <Text style={{ textAlign: 'center', color: '#667788', fontSize: 12 }}>
          الإصدار 2.12.1
        </Text>
      </TouchableOpacity>

      {showSecretInput && (
        <View style={{ padding: 15, backgroundColor: '#0f2438', borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: '#2c5070' }}>
          <TextInput
            placeholder="أدخل الرمز السري هنا..."
            value={inputCode}
            onChangeText={setInputCode}
            style={{ backgroundColor: '#0a192f', color: '#fff', borderBottomWidth: 1, borderColor: '#2c5070', padding: 8, marginBottom: 10, textAlign: 'center' }}
            placeholderTextColor="#667788"
          />
          <TouchableOpacity 
            onPress={verifySecretCode}
            style={{ backgroundColor: '#d4af37', padding: 12, borderRadius: 8, alignItems: 'center' }}
          >
            <Text style={{ color: '#0a192f', textAlign: 'center', fontWeight: 'bold' }}>تفعيل الميزات المدفوعة</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a192f' },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#0f2438', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1a3b5d' },
  dangerCard: { borderColor: '#5a2a2a', backgroundColor: '#1b1416' },
  titleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { color: '#d4af37', fontSize: 18, fontWeight: 'bold', textAlign: 'right', writingDirection: 'rtl' },
  note: { color: '#b9c4d2', fontSize: 13, lineHeight: 22, textAlign: 'right', writingDirection: 'rtl', marginBottom: 12 },
  label: { color: '#e8e8e8', fontSize: 14, textAlign: 'right', writingDirection: 'rtl', marginBottom: 8, marginTop: 8 },
  switchRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row-reverse', gap: 8, marginBottom: 8 },
  providerBtn: { flex: 1, paddingVertical: 12, backgroundColor: '#1a3b5d', borderRadius: 10, alignItems: 'center' },
  providerActive: { backgroundColor: '#d4af37' },
  providerText: { color: '#e8e8e8', fontWeight: 'bold' },
  providerTextActive: { color: '#0a192f' },
  input: { backgroundColor: '#0a192f', color: '#fff', padding: 12, borderRadius: 10, textAlign: 'right', writingDirection: 'rtl', borderWidth: 1, borderColor: '#2c5070', marginBottom: 12 },
  saveBtn: { backgroundColor: '#d4af37', padding: 14, borderRadius: 10, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  saveBtnText: { color: '#0a192f', fontWeight: 'bold', fontSize: 16 },
  actionsRow: { flexDirection: 'row-reverse', gap: 8, marginTop: 10 },
  ghostBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#2c5070', alignItems: 'center', minHeight: 46, justifyContent: 'center' },
  ghostText: { color: '#d4af37', fontWeight: 'bold', fontSize: 14 },
  testMsg: { textAlign: 'right', writingDirection: 'rtl', marginTop: 10, fontSize: 13 },
  disclosure: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1a3b5d' },
  disclosureText: { color: '#9fb0c3', fontSize: 12, flex: 1, textAlign: 'right', writingDirection: 'rtl' },
  dangerBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, backgroundColor: '#2c1a1a', borderRadius: 10, borderWidth: 1, borderColor: '#5a2a2a', minHeight: 48 },
  dangerText: { color: '#e74c3c', fontWeight: 'bold', fontSize: 15 },
});
