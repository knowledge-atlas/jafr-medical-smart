import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>عن التطبيق</Text>
      <Text style={styles.text}>
        هذا التطبيق يجمع بين علم الجفر وعلم النفس البنيوي لتقديم قراءة شاملة لأي اسم.
        {'\n\n'}
        يعتمد على نصوص موسوعية كاملة تم حفظها دون اختصار.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  text: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
});
