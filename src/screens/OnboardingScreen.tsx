import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const ONBOARDING_KEY = 'onboarding_completed_v1';

export const ONBOARDING_STORAGE_KEY = ONBOARDING_KEY;

const SLIDES = [
  {
    icon: '🔮',
    title: 'نظام تشغيل المعرفة السيادي',
    body: 'تطبيق تحليلي عميق يعمل بدون إنترنت 100%. يحوّل الاسم إلى قراءة رمزية شاملة عبر 11 محركاً تحليلياً.',
    color: '#d4af37',
  },
  {
    icon: '📜',
    title: 'تقرير من 18 قسماً',
    body: 'تقرير عميق + 7 منتجات متخصصة: التوافق، التشخيص التجاري، التقويم الزمني، الملف النفسي، وغيرها.',
    color: '#3498db',
  },
  {
    icon: '🧠',
    title: 'الملف النفسي المتكامل',
    body: '12 محوراً انعكاسياً يكشف بنيتك الداخلية: من الجوهر والمحرك، عبر الظل والانسجام، إلى الترياق الشامل.',
    color: '#27ae60',
  },
  {
    icon: '🛡️',
    title: 'خصوصية كاملة',
    body: 'كل البيانات على جهازك. لا سحابة، لا تتبع. التطبيق مرآة للتأمل، لا قاضٍ. اقرأه كخريطة، لا كحكم نهائي.',
    color: '#e74c3c',
  },
];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const next = async () => {
    if (index < SLIDES.length - 1) {
      const nextIdx = index + 1;
      setIndex(nextIdx);
      scrollRef.current?.scrollTo({ x: nextIdx * width, animated: true });
    } else {
      await finish();
    }
  };

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onDone();
  };

  const skip = async () => {
    await finish();
  };

  const slide = SLIDES[index];

  return (
    <View style={styles.container}>
      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={skip}>
        <Text style={styles.skipText}>تخطّي ←</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(i);
        }}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <Text style={styles.slideIcon}>{s.icon}</Text>
            <Text style={[styles.slideTitle, { color: s.color }]}>{s.title}</Text>
            <Text style={styles.slideBody}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      {/* Next / Start */}
      <TouchableOpacity
        style={[styles.nextBtn, { backgroundColor: slide.color }]}
        onPress={next}
      >
        <Text style={styles.nextText}>
          {index < SLIDES.length - 1 ? 'التالي' : 'ابدأ الآن'}
        </Text>
        <Ionicons
          name={index < SLIDES.length - 1 ? 'arrow-back' : 'checkmark-circle'}
          size={20}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  skipBtn: {
    position: 'absolute', top: 50, left: 20, zIndex: 10,
    paddingVertical: 8, paddingHorizontal: 14,
    backgroundColor: '#1a3b5d', borderRadius: 20,
  },
  skipText: { color: '#d4af37', fontSize: 13, fontWeight: 'bold' },

  slide: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  slideIcon: { fontSize: 90, marginBottom: 30 },
  slideTitle: {
    fontSize: 26, fontWeight: 'bold', marginBottom: 20,
    textAlign: 'center', writingDirection: 'rtl',
  },
  slideBody: {
    color: '#e8e8e8', fontSize: 15, lineHeight: 26,
    textAlign: 'center', writingDirection: 'rtl', paddingHorizontal: 10,
  },

  dots: {
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    paddingVertical: 20,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2c5070' },
  dotActive: { width: 24, backgroundColor: '#d4af37' },

  nextBtn: {
    flexDirection: 'row-reverse',
    marginHorizontal: 30, marginBottom: 40,
    paddingVertical: 16, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  nextText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
