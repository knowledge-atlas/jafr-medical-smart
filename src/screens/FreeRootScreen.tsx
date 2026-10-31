import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EnrichedMarkdownText } from '../utils/MarkdownMock';
import { useDirection } from '../utils/DirectionContext';

export default function FreeRootScreen({ route, navigation }: any) {
  const { name, analysis } = route.params || { name: 'المستخدم' };
  const { isRTL, toggleDirection } = useDirection();
  
  const fullText = analysis?.report || analysis?.text || '';
  let finalMarkdown = '';

  if (fullText) {
    // 1. استخراج الأقسام المطلوبة (بدءاً من الهوية العامة، وتجاهل التعريف والباطن/الظاهر)
    // نبحث عن بداية القسم 3
    let startIdx = fullText.indexOf('3. الهوية العامة');
    if (startIdx === -1) {
        startIdx = fullText.indexOf('الهوية العامة والمعنى البنيوي');
    }
    if (startIdx === -1) {
         // إذا لم يجد، يرجع للبداية
         startIdx = fullText.indexOf('1. التعريف') !== -1 ? fullText.indexOf('1. التعريف') : 0;
    }

    let endIdx = fullText.indexOf('9. نقطة الضعف');
    if (endIdx === -1) endIdx = fullText.indexOf('نقطة الانهيار');
    if (endIdx === -1) endIdx = fullText.length;

    let rawSection = fullText.substring(startIdx, endIdx);

    // 2. إضافة العناوين الفرعية (أولاً، ثانياً...) لتظهر كعناوين مميزة
    rawSection = rawSection.replace(/صاحب هذا الجذر يقرأ العالم/g, '\n\n### أولاً: البنية الإدراكية\n\nصاحب هذا الجذر يقرأ العالم');
    rawSection = rawSection.replace(/نمط تفكيره هو/g, '\n\n### ثانياً: نمط التفكير\n\nنمط تفكيره هو');
    rawSection = rawSection.replace(/حين يواجه الآخرون/g, '\n\n### ثالثاً: ما يظهر للناس\n\nحين يواجه الآخرون');
    rawSection = rawSection.replace(/لكن خلف هذا الوجه/g, '\n\n### رابعاً: ما يخفيه في العمق\n\nلكن خلف هذا الوجه');
    rawSection = rawSection.replace(/أقوى ما في هذا الجذر/g, '\n\n### خامساً: القوة الأساسية\n\nأقوى ما في هذا الجذر');

    // 3. تحويل ترقيم الأقسام (3. ، 4. ...) إلى عناوين Markdown
    rawSection = rawSection.replace(/^(\d+)\.\s*(.*)$/gm, '\n## $1. $2\n');

    // 4. تنظيف الأسطر ودمج الفقرات المقطوعة
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

    finalMarkdown = `# الجذر الحقيقي لاسم "${name}"\n\n` + formattedLines.join('\n\n');
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
