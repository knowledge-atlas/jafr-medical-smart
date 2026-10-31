import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EnrichedMarkdownText } from '../utils/MarkdownMock';
import { useDirection } from '../utils/DirectionContext';

export default function FreeRootScreen({ route, navigation }: any) {
  const { name, analysis } = route.params || { name: 'المستخدم' };
  const { isRTL, toggleDirection } = useDirection(); // استخدام الزر العالمي
  
  const fullText = analysis?.report || analysis?.text || '';
  let finalMarkdown = '';

  if (fullText) {
    const startIdx = fullText.indexOf('1. التعريف') !== -1 ? fullText.indexOf('1. التعريف') : fullText.indexOf('التعريف الجفري');
    let endIdx = fullText.indexOf('9. نقطة الضعف');
    if (endIdx === -1) endIdx = fullText.indexOf('نقطة الانهيار');
    if (endIdx === -1) endIdx = fullText.length;

    let rawSection = fullText.substring(startIdx, endIdx);

    rawSection = rawSection.replace(/أما ظاهره الجفري/g, '\n\n### أولاً: الظاهر الجفري\n\nأما ظاهره الجفري');
    rawSection = rawSection.replace(/وأما باطنه الجفري/g, '\n\n### ثانياً: الباطن الجفري\n\nوأما باطنه الجفري');
    rawSection = rawSection.replace(/ونقطة ضعفه الجفرية/g, '\n\n### ثالثاً: نقطة الضعف الجفرية\n\nونقطة ضعفه الجفرية');
    rawSection = rawSection.replace(/ومحرك خلله الجفري/g, '\n\n### رابعاً: محرك الخلل الجفري\n\nومحرك خلله الجفري');

    rawSection = rawSection.replace(/^(\d+)\.\s*(.*)$/gm, '\n## $1. $2\n');

    const lines = rawSection.split('\n');
    let formattedLines: string[] = [];
    let currentParagraph = '';

    for (let line of lines) {
      line = line.trim();
      if (!line) {
        if (currentParagraph) {
          formattedLines.push(currentParagraph);
          currentParagraph = '';
        }
        continue;
      }

      if (line.startsWith('## ') || line.startsWith('### ')) {
        if (currentParagraph) {
          formattedLines.push(currentParagraph);
          currentParagraph = '';
        }
        formattedLines.push('\n' + line + '\n');
      } else if (line.startsWith('*') || line.startsWith('-')) {
        if (currentParagraph) {
          formattedLines.push(currentParagraph);
          currentParagraph = '';
        }
        formattedLines.push(line.replace(/^[*\-]\s*/, '* '));
      } else {
        currentParagraph += (currentParagraph ? ' ' : '') + line;
      }
    }
    if (currentParagraph) formattedLines.push(currentParagraph);

    finalMarkdown = `# الجذر الحقيقي لاسم "${name}"\n\n> أهلاً بك في مساحتك الخاصة. هنا، لا نقدم تنبؤات، بل نقدم فهماً. ابدأ رحلتك نحو وعي أعمق بذاتك.\n\n` + formattedLines.join('\n\n');
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.directionBtn} onPress={toggleDirection}>
          <Ionicons name="swap-horizontal" size={20} color="#d4af37" />
          <Text style={styles.directionText}>{isRTL ? 'اتجاه: عربي' : 'اتجاه: إنجليزي'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {finalMarkdown ? (
          <EnrichedMarkdownText markdown={finalMarkdown} />
        ) : (
          <Text style={styles.errorText}>جاري تحميل البيانات...</Text>
        )}
        
        <TouchableOpacity 
          style={styles.upgradeBtn}
          onPress={() => navigation.navigate('ProductPicker', { name, analysis })}
        >
          <Text style={styles.upgradeText}>اكتشف خريطة وعيك الكاملة الآن</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a192f' },
  topBar: { flexDirection: 'row-reverse', padding: 10, borderBottomWidth: 1, borderBottomColor: '#1a3b5d', backgroundColor: '#0f2438' },
  directionBtn: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, gap: 6 },
  directionText: { color: '#d4af37', fontSize: 14, fontWeight: 'bold' },
  content: { padding: 20, paddingBottom: 50 },
  errorText: { color: '#e8e8e8', textAlign: 'center', marginTop: 20 },
  upgradeBtn: { backgroundColor: '#d4af37', padding: 15, borderRadius: 25, alignItems: 'center', marginTop: 30, marginHorizontal: 10 },
  upgradeText: { color: '#0a192f', fontSize: 18, fontWeight: 'bold' },
});
