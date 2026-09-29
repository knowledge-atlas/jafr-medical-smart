import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Button } from 'react-native';
import fullReportData from '../data/full_report.json';

export default function FullReportScreen() {
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openSection = (sec: any) => {
    setSelectedSection(sec);
    setModalVisible(true);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>التقرير الشامل (33 قسمًا)</Text>
      {(fullReportData as any).sections.map((sec: any) => (
        <TouchableOpacity key={sec.id} style={styles.sectionItem} onPress={() => openSection(sec)}>
          <Text style={styles.sectionText}>{sec.id}. {sec.title}</Text>
        </TouchableOpacity>
      ))}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, padding: 20 }}>
          <ScrollView>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>{selectedSection?.title}</Text>
            <Text style={{ fontSize: 14, lineHeight: 24 }}>{JSON.stringify(selectedSection?.data, null, 2)}</Text>
          </ScrollView>
          <Button title="إغلاق" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  sectionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  sectionText: { fontSize: 16 },
});
