import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { freeTrial } from '../monetization/freeTrial';

const WAITLIST_KEY = 'premium_waitlist_v1';

const PLANS = [
  { id: 'monthly', label: 'شهري', price: 4.99, period: 'شهرياً', save: null },
  { id: 'yearly',  label: 'سنوي',  price: 29.99, period: 'سنوياً', save: 'وفّر 50%' },
];

const FEATURES = [
  'تحليلات غير محدودة',
  'نسخ ومشاركة وتصدير PDF',
  'حفظ تاريخ التحليلات',
  'مساعد AI ذكي',
  'تحديثات مستمرة',
];

export default function PaywallScreen({ navigation }: any) {
  const [remaining, setRemaining] = useState(0);
  const [selected, setSelected] = useState<'monthly' | 'yearly'>('yearly');
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await freeTrial.remaining();
      setRemaining(r);
      const joined = await AsyncStorage.getItem(WAITLIST_KEY);
      if (joined) setJoined(true);
    })();
  }, []);

  const joinWaitlist = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert('تنبيه', 'أدخل بريداً صحيحاً');
      return;
    }
    try {
      await AsyncStorage.setItem(WAITLIST_KEY, JSON.stringify({
        email: trimmed,
        plan: selected,
        joinedAt: new Date().toISOString(),
      }));
      setJoined(true);
      Alert.alert('✅', 'سجّلنا اهتمامك! سنُعلمك فور تفعيل الدفع.');
    } catch (e: any) {
      Alert.alert('خطأ', e?.message ?? 'فشل الحفظ');
    }
  };

  const tryPurchase = () => {
    Alert.alert(
      '🔧 الدفع قيد التفعيل',
      'خدمة الدفع ستُطلق خلال أيام عبر Google Play.\n\nسجّل بريدك وسنُعلمك فوراً.',
      [
        { text: 'حسناً', style: 'cancel' },
        { text: 'أضف بريدي', onPress: () => {} },
      ]
    );
  };

  const selectedPlan = PLANS.find(p => p.id === selected)!;
  const yearlySave = PLANS.find(p => p.id === 'yearly')!.price;
  const monthlyFullYear = PLANS.find(p => p.id === 'monthly')!.price * 12;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>💎</Text>
        <Text style={styles.heroTitle}>
          {remaining > 0 ? `بقيت لك ${remaining} تحليلات` : 'جربت 3 تحليلات مجاناً'}
        </Text>
        <Text style={styles.heroSubtitle}>
          {remaining > 0
            ? 'النسخة الكاملة تفتح عالمًا من الميزات'
            : 'أطلق النسخة الكاملة وافتح كل الميزات'}
        </Text>
      </View>

      {/* Features */}
      <View style={styles.featureBox}>
        <Text style={styles.featureTitle}>✅ ما تحصل عليه في النسخة الكاملة</Text>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={18} color="#2ecc71" />
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      {/* Plans */}
      <View style={styles.planSection}>
        <Text style={styles.planTitle}>🎯 اختر خطتك</Text>
        {PLANS.map((p) => {
          const isSelected = selected === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.planCard, isSelected && styles.planCardActive]}
              onPress={() => setSelected(p.id as 'monthly' | 'yearly')}
            >
              <View style={styles.planHeader}>
                <Text style={[styles.planLabel, isSelected && { color: '#0a1628' }]}>
                  {p.label}
                </Text>
                {p.save && (
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveText}>{p.save}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.planPrice, isSelected && { color: '#0a1628' }]}>
                ${p.price}
              </Text>
              <Text style={[styles.planPeriod, isSelected && { color: '#0a1628' }]}>
                {p.period}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Yearly saving highlight */}
        <View style={styles.savingBox}>
          <Ionicons name="trending-down-outline" size={18} color="#2ecc71" />
          <Text style={styles.savingText}>
            الخطة السنوية توفّر ${(monthlyFullYear - yearlySave).toFixed(2)} سنوياً
          </Text>
        </View>
      </View>

      {/* Payment method */}
      <View style={styles.paymentBox}>
        <Text style={styles.paymentTitle}>💳 طرق السداد المتاحة</Text>
        <View style={styles.paymentRow}>
          <Ionicons name="logo-google" size={20} color="#2ecc71" />
          <Text style={styles.paymentText}>Google Play In-App Purchase</Text>
        </View>
        <View style={styles.paymentRow}>
          <Ionicons name="card-outline" size={20} color="#3498db" />
          <Text style={styles.paymentText}>بطاقات ائتمان (Visa/Mastercard)</Text>
        </View>
        <View style={styles.paymentRow}>
          <Ionicons name="cash-outline" size={20} color="#d4af37" />
          <Text style={styles.paymentText}>STC Pay · مدى · PayPal</Text>
        </View>
      </View>

      {/* CTA or Waitlist */}
      {!joined ? (
        <View style={styles.ctaBox}>
          <Text style={styles.ctaTitle}>🔔 الدفع قيد التفعيل النهائي</Text>
          <Text style={styles.ctaSubtitle}>
            سجّل بريدك وسنُعلمك فوراً عند الإطلاق
          </Text>
          <TextInput
            style={styles.emailInput}
            placeholder="بريدك الإلكتروني"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={joinWaitlist}>
            <Ionicons name="notifications-outline" size={18} color="#0a1628" />
            <Text style={styles.primaryBtnText}> سجّلني في القائمة</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={tryPurchase}>
            <Text style={styles.secondaryBtnText}>💳 محاولة الدفع الآن</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.successBox}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successTitle}>تم التسجيل!</Text>
          <Text style={styles.successBody}>
            سنُعلمك على {email || 'بريدك'} فور تفعيل الدفع.{'\n'}
            حتى ذلك الحين، تستطيع الاستمرار في استخدام التجربة المجانية.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← رجوع</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.footer}>
        🔒 لا نجمع بياناتك · البريد محفوظ على جهازك فقط
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  content: { padding: 16, paddingBottom: 40 },

  hero: { alignItems: 'center', paddingVertical: 24 },
  heroIcon: { fontSize: 60, marginBottom: 10 },
  heroTitle: { color: '#d4af37', fontSize: 20, fontWeight: 'bold', textAlign: 'center', writingDirection: 'rtl', marginBottom: 6 },
  heroSubtitle: { color: '#a0a0a0', fontSize: 13, textAlign: 'center', writingDirection: 'rtl', lineHeight: 20 },

  featureBox: { backgroundColor: '#0f2438', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2c5070' },
  featureTitle: { color: '#2ecc71', fontSize: 14, fontWeight: 'bold', marginBottom: 10, textAlign: 'right', writingDirection: 'rtl' },
  featureRow: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 5, gap: 10 },
  featureText: { color: '#e8e8e8', fontSize: 13, textAlign: 'right', writingDirection: 'rtl', flex: 1 },

  planSection: { marginBottom: 12 },
  planTitle: { color: '#d4af37', fontSize: 15, fontWeight: 'bold', marginBottom: 10, textAlign: 'right', writingDirection: 'rtl' },
  planCard: { backgroundColor: '#0f2438', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 2, borderColor: '#2c5070', alignItems: 'center' },
  planCardActive: { backgroundColor: '#d4af37', borderColor: '#d4af37' },
  planHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 6 },
  planLabel: { color: '#e8e8e8', fontSize: 15, fontWeight: 'bold', writingDirection: 'rtl' },
  saveBadge: { backgroundColor: '#2ecc71', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  saveText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  planPrice: { color: '#d4af37', fontSize: 28, fontWeight: 'bold', marginVertical: 4 },
  planPeriod: { color: '#a0a0a0', fontSize: 12, writingDirection: 'rtl' },

  savingBox: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#0f2438', borderRadius: 8, padding: 10, gap: 8, borderWidth: 1, borderColor: '#2ecc71' },
  savingText: { color: '#2ecc71', fontSize: 12, writingDirection: 'rtl' },

  paymentBox: { backgroundColor: '#0f2438', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2c5070' },
  paymentTitle: { color: '#d4af37', fontSize: 14, fontWeight: 'bold', marginBottom: 10, textAlign: 'right', writingDirection: 'rtl' },
  paymentRow: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 6, gap: 10 },
  paymentText: { color: '#e8e8e8', fontSize: 13, writingDirection: 'rtl', flex: 1 },

  ctaBox: { backgroundColor: '#1a3b5d', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: '#d4af37' },
  ctaTitle: { color: '#d4af37', fontSize: 15, fontWeight: 'bold', marginBottom: 6, textAlign: 'right', writingDirection: 'rtl' },
  ctaSubtitle: { color: '#a0a0a0', fontSize: 12, marginBottom: 12, textAlign: 'right', writingDirection: 'rtl' },
  emailInput: { backgroundColor: '#0a1628', color: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, borderWidth: 1, borderColor: '#2c5070', marginBottom: 10, textAlign: 'left' },
  primaryBtn: { flexDirection: 'row-reverse', backgroundColor: '#d4af37', paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 },
  primaryBtnText: { color: '#0a1628', fontSize: 14, fontWeight: 'bold' },
  secondaryBtn: { backgroundColor: 'transparent', paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#3498db' },
  secondaryBtnText: { color: '#3498db', fontSize: 13, fontWeight: 'bold' },

  successBox: { backgroundColor: '#0f2438', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: '#2ecc71', marginBottom: 12 },
  successIcon: { fontSize: 50, marginBottom: 10 },
  successTitle: { color: '#2ecc71', fontSize: 18, fontWeight: 'bold', marginBottom: 8, writingDirection: 'rtl' },
  successBody: { color: '#e8e8e8', fontSize: 13, textAlign: 'center', lineHeight: 22, writingDirection: 'rtl', marginBottom: 16 },
  backBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8, backgroundColor: '#1a3b5d' },
  backBtnText: { color: '#d4af37', fontSize: 14, fontWeight: 'bold' },

  footer: { color: '#666', fontSize: 11, textAlign: 'center', marginTop: 12 },
});
