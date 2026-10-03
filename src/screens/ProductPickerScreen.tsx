import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { analysisToLegacyReport } from '../application/di';
import { DeepDiveReport } from '../products/DeepDiveReport';
import { reportChat } from '../ai/ReportChat';
import { ContextMode } from '../ai/ContextAwarePrompter';

interface ProductCard {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
  badge?: string;
}

const PRODUCTS: ProductCard[] = [
  {
    id: 'deep-dive',
    title: 'التقرير العميق',
    subtitle: '19 قسماً موسوعياً + رنين + Schism + تقويم',
    icon: 'book',
    color: '#d4af37',
    route: 'Report',
    badge: '⭐ الأكثر شمولاً',
  },
  {
    id: 'compatibility',
    title: 'محرك التوافق',
    subtitle: '8 أبعاد + رنين حقيقي من نصوص البوني',
    icon: 'git-compare',
    color: '#3498db',
    route: 'Compatibility',
  },
  {
    id: 'brand',
    title: 'التشخيص التجاري',
    subtitle: 'تحليل اسم المشروع + 3 بدائل مقترحة',
    icon: 'pricetag',
    color: '#e74c3c',
    route: 'Brand',
  },
  {
    id: 'temporal',
    title: 'التقويم الزمني',
    subtitle: 'mod 7/9/12/28 + أيام الذروة والتعبئة',
    icon: 'calendar',
    color: '#9b59b6',
    route: 'Temporal',
  },
  {
    id: 'remedy',
    title: 'متتبع الالتزام',
    subtitle: 'تتبع التوصيات + Streak + حالة الالتزام',
    icon: 'checkmark-circle',
    color: '#27ae60',
    route: 'Remedy',
  },
  {
    id: 'psychology',
    title: 'الملف النفسي',
    subtitle: '15 محوراً تحليلياً متكاملاً',
    icon: 'person-circle',
    color: '#1abc9c',
    route: 'Report',
    badge: '🧠 داخل التقرير',
  },
];

export default function ProductPickerScreen({ navigation, route }: any) {
  const { analysis, name, mode } = route.params || {};

  const openProduct = (product: ProductCard) => {
    // ─── المنتجات التي تحتاج التقرير العميق (تحويل كامل) ───
    if (product.id === 'psychology' || product.id === 'deep-dive') {
      if (!analysis) {
        navigation.navigate('Home');
        return;
      }
      const deepDive = new DeepDiveReport();
      const ctxMode: ContextMode = (mode as ContextMode) ?? 'personal';
      const out = deepDive.generate(analysis, ctxMode, {
        richMarkdown: analysis.report,
      });
      reportChat.loadReport(out, ctxMode);
      const legacy = analysisToLegacyReport(analysis, out);
      navigation.navigate('Report', { report: legacy, name: analysis.name });
      return;
    }

    // ─── بقية المنتجات: تمرير analysis كاملاً ───
    navigation.navigate(product.route, {
      analysis,
      name,
      mode,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🎯</Text>
        <Text style={styles.heroTitle}>اختر التقرير المناسب</Text>
        <Text style={styles.heroSubtitle}>
          {name ? `الاسم: ${name}` : 'ابدأ من الرئيسية أولاً'}
        </Text>
        <Text style={styles.heroHint}>
          كل منتج يخدم غرضاً محدداً — من التحليل العميق إلى التتبع العملي.
        </Text>
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {PRODUCTS.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={[styles.card, { borderLeftColor: product.color }]}
            onPress={() => openProduct(product)}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: product.color + '22' }]}>
                <Ionicons name={product.icon} size={26} color={product.color} />
              </View>
              {product.badge && (
                <View style={[styles.badge, { backgroundColor: product.color }]}>
                  <Text style={styles.badgeText}>{product.badge}</Text>
                </View>
              )}
            </View>

            <Text style={styles.cardTitle}>{product.title}</Text>
            <Text style={styles.cardSubtitle}>{product.subtitle}</Text>

            <View style={styles.cardFooter}>
              <Text style={[styles.cardAction, { color: product.color }]}>
                افتح →
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.footer}>© 2026 — KnowledgeAtlas Sovereign v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#0a1628', flexGrow: 1 },
  hero: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#1a3b5d',
    borderRadius: 16,
  },
  heroEmoji: { fontSize: 40, marginBottom: 8 },
  heroTitle: { color: '#d4af37', fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  heroSubtitle: { color: '#e8e8e8', fontSize: 14, marginBottom: 8 },
  heroHint: { color: '#a0a0a0', fontSize: 12, textAlign: 'center', lineHeight: 18 },

  grid: { gap: 12 },
  card: {
    backgroundColor: '#1a3b5d',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  cardSubtitle: { color: '#b0b8c0', fontSize: 13, lineHeight: 20, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end' },
  cardAction: { fontSize: 13, fontWeight: 'bold' },

  footer: { textAlign: 'center', color: '#555', fontSize: 11, marginTop: 20 },
});
