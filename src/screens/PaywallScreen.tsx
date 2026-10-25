import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { freeTrial } from '../monetization/freeTrial';

export default function PaywallScreen({ navigation }: any) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    (async () => {
      const r = await freeTrial.remaining();
      setRemaining(r);
    })();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>✨</Text>
        <Text style={styles.heroTitle}>
          {remaining > 0 ? `بقيت لك ${remaining} تحليلات` : 'انتهت تجربتك المجانية'}
        </Text>
        <Text style={styles.heroSubtitle}>
          {remaining > 0
            ? 'تحليلات كاملة بكل البيانات والمصادر'
            : 'شكراً لتجربتك! النسخة الكاملة قادمة قريباً'}
        </Text>
      </View>

      {/* Feature list */}
      <View style={styles.featureBox}>
        <Text style={styles.featureTitle}>🎁 ما تحصل عليه الآن مجاناً:</Text>
        <View style={styles.featureRow}>
          <Ionicons name="checkmark-circle" size={20} color="#2ecc71" />
          <Text style={styles.featureText}>3 تحليلات كاملة</Text>
        </View>
        <View style={styles.featureRow}>
          <Ionicons name="checkmark-circle" size={20} color="#2ecc71" />
          <Text style={styles.featureText}>تقرير من 18 قسماً بكل المصادر</Text>
        </View>
        <View style={styles.featureRow}>
          <Ionicons name="checkmark-circle" size={20} color="#2ecc71" />
          <Text style={styles.featureText}>الملف النفسي (12 محوراً)</Text>
        </View>
        <View style={styles.featureRow}>
          <Ionicons name="checkmark-circle" size={20} color="#2ecc71" />
          <Text style={styles.featureText}>شواهد خارجية موثقة</Text>
        </View>
      </View>

      {/* Premium coming */}
      <View style={styles.premiumBox}>
        <Text style={styles.premiumTitle}>💎 النسخة الكاملة — قريباً</Text>
        <Text style={styles.premiumSubtitle}>قيد التطوير حالياً. ستتيح لك:</Text>

        <View style={styles.premiumRow}>
          <Ionicons name="lock-open-outline" size={20} color="#d4af37" />
          <Text style={styles.premiumText}>تحليلات غير محدودة</Text>
        </View>
        <View style={styles.premiumRow}>
          <Ionicons name="lock-open-outline" size={20} color="#d4af37" />
          <Text style={styles.premiumText}>نسخ ومشاركة وتصدير PDF</Text>
        </View>
        <View style={styles.premiumRow}>
          <Ionicons name="lock-open-outline" size={20} color="#d4af37" />
          <Text style={styles.premiumText}>حفظ تاريخ التحليلات</Text>
        </View>
        <View style={styles.premiumRow}>
          <Ionicons name="lock-open-outline" size={20} color="#d4af37" />
          <Text style={styles.premiumText}>مساعد AI ذكي</Text>
        </View>
      </View>

      {/* Action */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backBtnText}>← رجوع</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        لا نجمع بياناتك · كل شيء على جهازك
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  content: { padding: 20, paddingBottom: 40 },

  hero: { alignItems: 'center', paddingVertical: 30 },
  heroIcon: { fontSize: 70, marginBottom: 12 },
  heroTitle: { color: '#d4af37', fontSize: 22, fontWeight: 'bold', textAlign: 'center', writingDirection: 'rtl', marginBottom: 8 },
  heroSubtitle: { color: '#a0a0a0', fontSize: 14, textAlign: 'center', writingDirection: 'rtl', lineHeight: 22 },

  featureBox: { backgroundColor: '#0f2438', borderRadius: 12, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#2ecc71' },
  featureTitle: { color: '#2ecc71', fontSize: 15, fontWeight: 'bold', marginBottom: 12, textAlign: 'right', writingDirection: 'rtl' },
  featureRow: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 6, gap: 10 },
  featureText: { color: '#e8e8e8', fontSize: 14, textAlign: 'right', writingDirection: 'rtl', flex: 1 },

  premiumBox: { backgroundColor: '#1a3b5d', borderRadius: 12, padding: 18, marginBottom: 14, borderWidth: 2, borderColor: '#d4af37' },
  premiumTitle: { color: '#d4af37', fontSize: 16, fontWeight: 'bold', marginBottom: 6, textAlign: 'right', writingDirection: 'rtl' },
  premiumSubtitle: { color: '#a0a0a0', fontSize: 13, marginBottom: 12, textAlign: 'right', writingDirection: 'rtl' },
  premiumRow: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 8, gap: 10 },
  premiumText: { color: '#e8e8e8', fontSize: 14, textAlign: 'right', writingDirection: 'rtl', flex: 1 },

  backBtn: { backgroundColor: '#0f2438', paddingVertical: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#2c5070' },
  backBtnText: { color: '#d4af37', fontSize: 15, fontWeight: 'bold' },

  footer: { color: '#666', fontSize: 11, textAlign: 'center', marginTop: 20 },
});
