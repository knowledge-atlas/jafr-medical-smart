import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const WAITLIST_KEY = 'medical_waitlist_v1';

export default function ComingSoonScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const subscribe = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert('تنبيه', 'أدخل بريداً صحيحاً');
      return;
    }

    try {
      const raw = await AsyncStorage.getItem(WAITLIST_KEY);
      const list = raw ? JSON.parse(raw) : [];
      if (!list.includes(trimmed)) {
        list.push(trimmed);
        await AsyncStorage.setItem(WAITLIST_KEY, JSON.stringify(list));
      }
      setSubmitted(true);
    } catch (e: any) {
      Alert.alert('خطأ', e?.message ?? 'فشل الحفظ');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroBox}>
        <Text style={styles.heroIcon}>🔮</Text>
        <Text style={styles.heroTitle}>الوحدة الطبية التكاملية</Text>
        <Text style={styles.heroSubtitle}>قريباً</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📖 ما هي هذه الوحدة؟</Text>
        <Text style={styles.cardBody}>
          وحدة معرفية تجمع بين الطب التراثي (طب البوني) والمقاربات الرمزية لطبائع الأسماء.
          {'\n\n'}
          هذه الوحدة تخضع حالياً لمراجعة علمية وقانونية شاملة قبل الإطلاق لضمان دقتها
          واحترام المعايير الطبية والأخلاقية.
        </Text>
      </View>

      <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>⚠️ تنبيه مهم</Text>
        <Text style={styles.warningBody}>
          هذا التطبيق أداة تأمل رمزية تراثية. لا يقدم تشخيصاً طبياً ولا توصيات دوائية.
          عند الحاجة لاستشارة طبية، راجع طبيباً مختصاً.
        </Text>
      </View>

      {!submitted ? (
        <View style={styles.formBox}>
          <Text style={styles.formTitle}>🔔 أعلمني عند الإطلاق</Text>
          <Text style={styles.formHint}>اترك بريدك ليصلك الإشعار فوراً</Text>
          <TextInput
            style={styles.input}
            placeholder="example@mail.com"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.button} onPress={subscribe}>
            <Ionicons name="notifications-outline" size={18} color="#0a1628" />
            <Text style={styles.buttonText}> سجّلني في القائمة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.successBox}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>شكراً لك!</Text>
          <Text style={styles.successBody}>
            سنُعلمك فور إطلاق الوحدة الطبية. بريدك محفوظ محلياً على جهازك فقط.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← رجوع</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🔒 لا نجمع بياناتك — البريد محفوظ على جهازك فقط
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  content: { padding: 16, paddingBottom: 40 },

  heroBox: { alignItems: 'center', paddingVertical: 30 },
  heroIcon: { fontSize: 60, marginBottom: 12 },
  heroTitle: { color: '#d4af37', fontSize: 22, fontWeight: 'bold', textAlign: 'center', writingDirection: 'rtl' },
  heroSubtitle: { color: '#a0a0a0', fontSize: 14, marginTop: 8 },

  card: { backgroundColor: '#0f2438', borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#2c5070' },
  cardTitle: { color: '#d4af37', fontSize: 15, fontWeight: 'bold', marginBottom: 10, textAlign: 'right', writingDirection: 'rtl' },
  cardBody: { color: '#e8e8e8', fontSize: 13, lineHeight: 22, textAlign: 'right', writingDirection: 'rtl' },

  warningBox: { backgroundColor: '#2c1a1a', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#e67e22' },
  warningTitle: { color: '#e67e22', fontSize: 14, fontWeight: 'bold', marginBottom: 8, textAlign: 'right', writingDirection: 'rtl' },
  warningBody: { color: '#e8e8e8', fontSize: 12, lineHeight: 20, textAlign: 'right', writingDirection: 'rtl' },

  formBox: { backgroundColor: '#0f2438', borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#d4af37' },
  formTitle: { color: '#d4af37', fontSize: 15, fontWeight: 'bold', marginBottom: 6, textAlign: 'right', writingDirection: 'rtl' },
  formHint: { color: '#a0a0a0', fontSize: 12, marginBottom: 12, textAlign: 'right', writingDirection: 'rtl' },
  input: { backgroundColor: '#0a1628', color: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, borderWidth: 1, borderColor: '#2c5070', marginBottom: 10, textAlign: 'left' },
  button: { flexDirection: 'row-reverse', backgroundColor: '#d4af37', paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonText: { color: '#0a1628', fontSize: 14, fontWeight: 'bold' },

  successBox: { backgroundColor: '#0f2438', borderRadius: 12, padding: 24, marginBottom: 14, alignItems: 'center', borderWidth: 2, borderColor: '#2ecc71' },
  successIcon: { fontSize: 50, marginBottom: 10 },
  successTitle: { color: '#2ecc71', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  successBody: { color: '#e8e8e8', fontSize: 13, textAlign: 'center', lineHeight: 22, writingDirection: 'rtl', marginBottom: 16 },
  backBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8, backgroundColor: '#1a3b5d' },
  backBtnText: { color: '#d4af37', fontSize: 14, fontWeight: 'bold' },

  footer: { alignItems: 'center', marginTop: 20 },
  footerText: { color: '#666', fontSize: 11, textAlign: 'center' },
});
