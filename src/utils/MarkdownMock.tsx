import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDirection } from './DirectionContext';

export const EnrichedMarkdownText = ({ markdown }: any) => {
  const { isRTL } = useDirection(); // يقرأ الاتجاه من الـ Context

  if (!markdown) return null;
  
  const blocks = markdown.split('\n\n');

  const dirStyle = {
    textAlign: isRTL ? 'right' : 'left',
    writingDirection: isRTL ? 'rtl' : 'ltr',
  } as any;

  return (
    <View style={styles.container}>
      {blocks.map((block: string, index: number) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith('#')) {
          const level = trimmed.match(/^#+/)?.[0].length || 1;
          const text = trimmed.replace(/^#+\s*/, '');
          const style = level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3;
          return <Text key={index} style={[style, dirStyle]}>{text}</Text>;
        }

        if (trimmed.startsWith('|')) {
          const rows = trimmed.split('\n').filter(r => r.includes('|') && !r.includes('---'));
          return (
            <View key={index} style={styles.table}>
              {rows.map((row, rIndex) => {
                const cells = row.split('|').filter(c => c.trim() !== '');
                return (
                  <View key={rIndex} style={[styles.tr, rIndex === 0 && styles.thead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    {cells.map((cell, cIndex) => (
                      <View key={cIndex} style={styles.td}>
                        <Text style={[rIndex === 0 ? styles.thText : styles.tdText, dirStyle]}>
                          {cell.trim()}
                        </Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          );
        }

        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const items = trimmed.split('\n');
          return (
            <View key={index} style={styles.listContainer}>
              {items.map((item, iIndex) => (
                <View key={iIndex} style={[styles.listItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={[styles.listText, dirStyle]}>{item.replace(/^[*\-]\s*/, '')}</Text>
                </View>
              ))}
            </View>
          );
        }

        return <Text key={index} style={[styles.paragraph, dirStyle]}>{trimmed}</Text>;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', paddingHorizontal: 10 },
  h1: { color: '#d4af37', fontSize: 24, fontWeight: 'bold', marginTop: 20, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#2c5070', paddingBottom: 10 },
  h2: { color: '#d4af37', fontSize: 20, fontWeight: 'bold', marginTop: 15, marginBottom: 10 },
  h3: { color: '#e8e8e8', fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 10 },
  paragraph: { color: '#e8e8e8', fontSize: 16, lineHeight: 30, marginBottom: 15 },
  table: { borderWidth: 1, borderColor: '#2c5070', borderRadius: 8, marginVertical: 15, width: '100%', overflow: 'hidden' },
  tr: { borderBottomWidth: 1, borderBottomColor: '#2c5070' },
  thead: { backgroundColor: '#1a3b5d' },
  td: { flex: 1, padding: 10, borderLeftWidth: 1, borderLeftColor: '#2c5070', justifyContent: 'center' },
  thText: { color: '#d4af37', fontWeight: 'bold', fontSize: 15 },
  tdText: { color: '#e8e8e8', fontSize: 14 },
  listContainer: { marginBottom: 15 },
  listItem: { alignItems: 'flex-start', marginBottom: 8 },
  bullet: { color: '#d4af37', fontSize: 18, marginLeft: 8, marginRight: 8 },
  listText: { color: '#e8e8e8', fontSize: 16, lineHeight: 28, flex: 1 },
});
