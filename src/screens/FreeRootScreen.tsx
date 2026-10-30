import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { EnrichedMarkdownText } from 'react-native-enriched-markdown';

export default function FreeRootScreen({ route, navigation }: any) {
  const { name } = route.params || { name: 'المستخدم' };

  const freeMarkdown = `
# الجذر الحقيقي لاسم "${name}"
### نواتك الأولى التي بُنيت عليها شخصيتك

لقد قمنا بتحليل اسمك بناءً على منظومة الجفر التراثية. هذا هو جذرك الحقيقي، وهو المفتاح الأول لفهم طبقاتك الأعمق.

**الجذر:** (سيتم جلبه ديناميكياً)
**الطبع:** (سيتم جلبه ديناميكياً)
**الكوكب:** (سيتم جلبه ديناميكياً)

> 💡 **رسالة لك:** هذا الجزء مجاني بالكامل لتبني ثقتك في دقة التحليل. للوصول إلى "ظلك"، "محرك فشلك"، و"ترياقك" في 18 قسماً، يرجى تفعيل العضوية المدفوعة.
  `;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <EnrichedMarkdownText
          flavor="github"
          markdown={freeMarkdown}
          markdownStyle={markdownStyles}
          selectionColor="rgba(212, 175, 55, 0.3)"
        />
        
        <TouchableOpacity 
          style={styles.upgradeBtn}
          onPress={() => Alert.alert('الاشتراك', 'سيتم توجيهك لبوابة الدفع قريباً لفتح باقي التبويبات.')}
        >
          <Text style={styles.upgradeText}>اكتشف تقريرك العميق بالكامل الآن</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a192f' },
  content: { padding: 20, paddingBottom: 50 },
  upgradeBtn: { backgroundColor: '#d4af37', padding: 15, borderRadius: 25, alignItems: 'center', marginTop: 30 },
  upgradeText: { color: '#0a192f', fontSize: 18, fontWeight: 'bold' },
});

const markdownStyles: any = {
  body: { color: '#e8e8e8', fontSize: 16, lineHeight: 28 },
  heading1: { color: '#d4af37', fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  heading3: { color: '#d4af37', fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  blockquote: { borderRightWidth: 4, borderRightColor: '#d4af37', paddingRight: 12, marginVertical: 12, backgroundColor: 'rgba(212, 175, 55, 0.05)', padding: 10, borderRadius: 4 },
};
