import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { MEDICAL_ROOTS, MEDICAL_REMAINDERS } from '../data/medicalRoots';
import {
  TABLE_1_ROOT_NEURO_DRUG_ANTIDOTE,
  TABLE_2_REMAINDER_DISORDER_DRUG_ANTIDOTE,
  TABLE_3_ELEMENT_ORGAN_SYSTEM_DRUG,
  TABLE_4_HOUSE_DOMAIN_DISORDER_DRUG,
  TABLE_5_PLANET_GLAND_HORMONE_DRUG,
  TABLE_6_SYMBOLIC_NEURAL_HORMONAL,
  TABLE_7_DIAGNOSIS_TREATMENT_FOLLOWUP,
  TABLE_8_DRUG_DOSE_TIMING_DURATION,
  TABLE_9_SYMPTOMS_ROOT_REMAINDER_DRUG,
  TABLE_10_SUPPLEMENT_DOSE_MECHANISM_WARNING,
  TABLE_11_ROOT_RESONANCE,
  TABLE_12_REMAINDER_RESONANCE,
  TABLE_13_PLANET_RESONANCE,
  TABLE_17_SYMPTOM_ROOT_DRUG_ANTIDOTE,
  TABLE_18_DRUG_MECHANISM_SIDEEFFECTS_MONITORING,
  TABLE_19_PSYCHOTHERAPY_ROOT_GOAL_DURATION,
  TABLE_20_FINAL_SUMMARY,
} from '../data/medicalTables';

export default function MedicalScreen({ route }: any) {
  const { root, remainder, planet, house, element } = route.params || {};
  const [activeTab, setActiveTab] = useState<'summary' | 'root' | 'remainder' | 'tables'>('summary');

  const rootData = root ? MEDICAL_ROOTS[root] : null;
  const remainderData = remainder ? MEDICAL_REMAINDERS[remainder] : null;

  const renderRow = (label: string, value: string) => (
    <View style={styles.row} key={label}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );

  const renderTable = (title: string, headers: string[], rows: any[][]) => (
    <View style={styles.tableCard}>
      <Text style={styles.tableTitle}>{title}</Text>
      <View style={styles.tableHeaderRow}>
        {headers.map((h, i) => (
          <Text key={i} style={styles.tableHeaderCell}>{h}</Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.tableRow}>
          {row.map((cell, ci) => (
            <Text key={ci} style={styles.tableCell}>{cell}</Text>
          ))}
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>🏥 نظام الجفر الطبي الذكي</Text>
      <Text style={styles.subtitle}>ميزان المرآة الذكي — الطب التكاملي الرمزي-العصبي</Text>

      {/* أزرار التبويبات الفرعية */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'summary' && styles.tabActive]}
          onPress={() => setActiveTab('summary')}
        >
          <Text style={[styles.tabText, activeTab === 'summary' && styles.tabTextActive]}>ملخص</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'root' && styles.tabActive]}
          onPress={() => setActiveTab('root')}
        >
          <Text style={[styles.tabText, activeTab === 'root' && styles.tabTextActive]}>الجذر</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'remainder' && styles.tabActive]}
          onPress={() => setActiveTab('remainder')}
        >
          <Text style={[styles.tabText, activeTab === 'remainder' && styles.tabTextActive]}>الباقي</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'tables' && styles.tabActive]}
          onPress={() => setActiveTab('tables')}
        >
          <Text style={[styles.tabText, activeTab === 'tables' && styles.tabTextActive]}>الجداول</Text>
        </TouchableOpacity>
      </View>

      {/* التبويب 1: الملخص */}
      {activeTab === 'summary' && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>البيانات الأساسية</Text>
            {root && renderRow('الجذر', `${root} - ${rootData?.name || ''}`)}
            {remainder && renderRow('الباقي', `${remainder} - ${remainderData?.name || ''}`)}
            {planet && renderRow('الكوكب', planet)}
            {house && renderRow('البيت', String(house))}
            {element && renderRow('الطبع', element)}
          </View>

          {rootData && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>ملخص طبي للجذر {root}</Text>
              {renderRow('الناقل العصبي', rootData.neurotransmitter)}
              {renderRow('الغدة', rootData.gland)}
              {renderRow('الهرمون', rootData.hormone)}
              {renderRow('العضو', rootData.organ)}
              {renderRow('الدواء الأساسي', rootData.primaryDrug)}
              {renderRow('المكمل', rootData.supplement)}
              {renderRow('الترياق الرمزي', rootData.symbolicAntidote)}
              {renderRow('الترياق النفسي', rootData.psychologicalAntidote)}
            </View>
          )}

          {remainderData && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>ملخص طبي للباقي {remainder}</Text>
              {renderRow('الخلل', remainderData.disorder)}
              {renderRow('الأعراض', remainderData.symptoms)}
              {renderRow('الناقل العصبي', remainderData.neurotransmitter)}
              {renderRow('الدواء الأساسي', remainderData.primaryDrug)}
              {renderRow('المكمل', remainderData.supplement)}
              {renderRow('الترياق الرمزي', remainderData.symbolicAntidote)}
              {renderRow('الترياق النفسي', remainderData.psychologicalAntidote)}
            </View>
          )}
        </>
      )}

      {/* التبويب 2: تفاصيل الجذر */}
      {activeTab === 'root' && rootData && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>الجذر {root} - {rootData.name}</Text>
          {renderRow('الاسم', rootData.name)}
          {renderRow('الرمز', rootData.symbol)}
          {renderRow('الظاهر', rootData.external)}
          {renderRow('الباطن', rootData.internal)}
          {renderRow('الناقل العصبي', rootData.neurotransmitter)}
          {renderRow('المستقبلات', rootData.receptors)}
          {renderRow('الغدة', rootData.gland)}
          {renderRow('الهرمون', rootData.hormone)}
          {renderRow('العضو', rootData.organ)}
          {renderRow('الجهاز', rootData.system)}
          {renderRow('النمط النفسي', rootData.psychologicalPattern)}
          {renderRow('نمط التعلق', rootData.attachmentStyle)}
          {renderRow('الدواء الأساسي', rootData.primaryDrug)}
          {renderRow('الدواء البديل', rootData.alternativeDrug)}
          {renderRow('الجرعة', rootData.dose)}
          {renderRow('المكمل', rootData.supplement)}
          {renderRow('العلاج النفسي', rootData.psychotherapy)}
          {renderRow('العلاج الحركي', rootData.movementTherapy)}
          {renderRow('الغذاء', rootData.food)}
          {renderRow('النوم', rootData.sleep)}
          {renderRow('الرياضة', rootData.exercise)}
          {renderRow('الترياق الرمزي', rootData.symbolicAntidote)}
          {renderRow('الترياق النفسي', rootData.psychologicalAntidote)}
          {renderRow('نقطة الانهيار', rootData.breakdownPoint)}
          {renderRow('المآل', rootData.outcome)}
        </View>
      )}

      {activeTab === 'root' && !rootData && (
        <Text style={styles.empty}>لا توجد بيانات جذر متاحة</Text>
      )}

      {/* التبويب 3: تفاصيل الباقي */}
      {activeTab === 'remainder' && remainderData && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>الباقي {remainder} - {remainderData.name}</Text>
          {renderRow('الاسم', remainderData.name)}
          {renderRow('الرمز', remainderData.symbol)}
          {renderRow('الظاهر', remainderData.external)}
          {renderRow('الباطن', remainderData.internal)}
          {renderRow('الخلل', remainderData.disorder)}
          {renderRow('الأعراض', remainderData.symptoms)}
          {renderRow('الناقل العصبي', remainderData.neurotransmitter)}
          {renderRow('الغدة', remainderData.gland)}
          {renderRow('العضو', remainderData.organ)}
          {renderRow('الدواء الأساسي', remainderData.primaryDrug)}
          {renderRow('الدواء البديل', remainderData.alternativeDrug)}
          {renderRow('الجرعة', remainderData.dose)}
          {renderRow('المكمل', remainderData.supplement)}
          {renderRow('العلاج النفسي', remainderData.psychotherapy)}
          {renderRow('العلاج الحركي', remainderData.movementTherapy)}
          {renderRow('الترياق', remainderData.antidote)}
          {renderRow('الترياق الرمزي', remainderData.symbolicAntidote)}
          {renderRow('الترياق النفسي', remainderData.psychologicalAntidote)}
          {renderRow('المآل', remainderData.outcome)}
        </View>
      )}

      {activeTab === 'remainder' && !remainderData && (
        <Text style={styles.empty}>لا توجد بيانات باقي متاحة</Text>
      )}

      {/* التبويب 4: الجداول التكاملية */}
      {activeTab === 'tables' && (
        <>
          {renderTable('جدول 1: الجذر ← الناقل ← الدواء ← الترياق',
            ['الجذر', 'الناقل', 'الدواء', 'الترياق الرمزي', 'الترياق النفسي'],
            TABLE_1_ROOT_NEURO_DRUG_ANTIDOTE.map(r => [r.root, r.neurotransmitter, r.drug, r.symbolicAntidote, r.psychologicalAntidote]))}

          {renderTable('جدول 2: الباقي ← الخلل ← الدواء ← الترياق',
            ['الباقي', 'الخلل', 'الدواء', 'الترياق الرمزي', 'الترياق النفسي'],
            TABLE_2_REMAINDER_DISORDER_DRUG_ANTIDOTE.map(r => [r.remainder, r.disorder, r.drug, r.symbolicAntidote, r.psychologicalAntidote]))}

          {renderTable('جدول 3: الطبع ← العضو ← الجهاز ← الدواء',
            ['الطبع', 'العضو', 'الجهاز', 'الدواء', 'المكمل'],
            TABLE_3_ELEMENT_ORGAN_SYSTEM_DRUG.map(r => [r.element, r.organ, r.system, r.drug, r.supplement]))}

          {renderTable('جدول 4: البيت ← المجال ← الخلل ← الدواء',
            ['البيت', 'المجال', 'الخلل', 'الدواء', 'الترياق'],
            TABLE_4_HOUSE_DOMAIN_DISORDER_DRUG.map(r => [r.house, r.domain, r.disorder, r.drug, r.antidote]))}

          {renderTable('جدول 5: الكوكب ← الغدة ← الهرمون ← الدواء',
            ['الكوكب', 'الغدة', 'الهرمون', 'الدواء', 'المكمل'],
            TABLE_5_PLANET_GLAND_HORMONE_DRUG.map(r => [r.planet, r.gland, r.hormone, r.drug, r.supplement]))}

          {renderTable('جدول 6: البعد الرمزي ← العصبي ← الهرموني',
            ['الفئة', 'العصبي', 'الهرموني', 'القلبي', 'الحركي'],
            TABLE_6_SYMBOLIC_NEURAL_HORMONAL.map(r => [r.category, r.neural, r.hormonal, r.cardiac, r.movement]))}

          {renderTable('جدول 7: التشخيص ← العلاج ← المتابعة',
            ['البعد', 'التشخيص', 'العلاج', 'المتابعة'],
            TABLE_7_DIAGNOSIS_TREATMENT_FOLLOWUP.map(r => [r.dimension, r.diagnosis, r.treatment, r.followup]))}

          {renderTable('جدول 8: الدواء ← الجرعة ← التوقيت ← المدة',
            ['الدواء', 'الجرعة', 'التوقيت', 'المدة', 'المراقبة'],
            TABLE_8_DRUG_DOSE_TIMING_DURATION.map(r => [r.drug, r.dose, r.timing, r.duration, r.monitoring]))}

          {renderTable('جدول 9: الأعراض ← الجذر ← الباقي ← الدواء',
            ['العرض', 'الجذر', 'الباقي', 'الدواء'],
            TABLE_9_SYMPTOMS_ROOT_REMAINDER_DRUG.map(r => [r.symptom, r.root, r.remainder, r.drug]))}

          {renderTable('جدول 10: المكمل ← الجرعة ← الآلية ← التحذير',
            ['المكمل', 'الجرعة', 'الآلية', 'التحذير'],
            TABLE_10_SUPPLEMENT_DOSE_MECHANISM_WARNING.map(r => [r.supplement, r.dose, r.mechanism, r.warning]))}

          {renderTable('جدول 11: الرنين بين الجذور',
            ['الجذر', 'يتوافق', 'يتصادم', 'محايد'],
            TABLE_11_ROOT_RESONANCE.map(r => [r.root, r.compatible, r.conflicts, r.neutral]))}

          {renderTable('جدول 12: الرنين بين البواقي',
            ['الباقي', 'يتوافق', 'يتصادم', 'محايد'],
            TABLE_12_REMAINDER_RESONANCE.map(r => [r.remainder, r.compatible, r.conflicts, r.neutral]))}

          {renderTable('جدول 13: الرنين بين الكواكب',
            ['الكوكب', 'يتوافق', 'يتصادم', 'محايد'],
            TABLE_13_PLANET_RESONANCE.map(r => [r.planet, r.compatible, r.conflicts, r.neutral]))}

          {renderTable('جدول 17: الأعراض ← الجذر ← الدواء ← الترياق',
            ['العرض', 'الجذر', 'الدواء', 'الترياق'],
            TABLE_17_SYMPTOM_ROOT_DRUG_ANTIDOTE.map(r => [r.symptom, r.root, r.drug, r.antidote]))}

          {renderTable('جدول 18: الدواء ← الآلية ← الأعراض الجانبية ← المراقبة',
            ['الدواء', 'الآلية', 'الأعراض الجانبية', 'المراقبة'],
            TABLE_18_DRUG_MECHANISM_SIDEEFFECTS_MONITORING.map(r => [r.drug, r.mechanism, r.sideEffects, r.monitoring]))}

          {renderTable('جدول 19: العلاج النفسي ← الجذر ← الهدف ← المدة',
            ['العلاج', 'الجذر', 'الهدف', 'المدة'],
            TABLE_19_PSYCHOTHERAPY_ROOT_GOAL_DURATION.map(r => [r.therapy, r.root, r.goal, r.duration]))}

          {renderTable('جدول 20: الخلاصة النهائية',
            ['الجذر', 'الرمز', 'الناقل', 'الغدة', 'العضو', 'الدواء', 'الترياق'],
            TABLE_20_FINAL_SUMMARY.map(r => [r.root, r.symbol, r.neurotransmitter, r.gland, r.organ, r.drug, r.antidote]))}
        </>
      )}

      <View style={styles.warning}>
        <Text style={styles.warningText}>
          ⚠️ ملاحظة: هذه الجداول في طور التأسيس، وتحتاج إلى مراجعة أقران ودراسات سريرية. لا تُستخدم لتشخيص أو علاج دون إشراف طبي مختص.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: '#f0f4f8' },
  header: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#1a3b5d', marginTop: 10 },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#7f8c8d', marginBottom: 15 },
  tabsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
  tabBtn: { flex: 1, padding: 10, marginHorizontal: 3, borderRadius: 8, backgroundColor: '#ecf0f1' },
  tabActive: { backgroundColor: '#2980b9' },
  tabText: { textAlign: 'center', color: '#2c3e50', fontWeight: 'bold', fontSize: 12 },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 15, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a3b5d', marginBottom: 10, textAlign: 'right' },
  row: { flexDirection: 'row-reverse', borderBottomWidth: 1, borderBottomColor: '#ecf0f1', paddingVertical: 6 },
  rowLabel: { flex: 1, fontSize: 13, color: '#7f8c8d', textAlign: 'right' },
  rowValue: { flex: 2, fontSize: 13, color: '#2c3e50', textAlign: 'right', fontWeight: '500' },
  empty: { textAlign: 'center', color: '#95a5a6', marginTop: 30, fontSize: 14 },
  tableCard: { backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 15, elevation: 2 },
  tableTitle: { fontSize: 14, fontWeight: 'bold', color: '#1a3b5d', marginBottom: 8, textAlign: 'right' },
  tableHeaderRow: { flexDirection: 'row-reverse', backgroundColor: '#34495e', borderRadius: 5, paddingVertical: 6 },
  tableHeaderCell: { flex: 1, fontSize: 11, color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  tableRow: { flexDirection: 'row-reverse', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#ecf0f1' },
  tableCell: { flex: 1, fontSize: 11, color: '#2c3e50', textAlign: 'center' },
  warning: { backgroundColor: '#fff3cd', padding: 10, borderRadius: 8, marginTop: 15, marginBottom: 30 },
  warningText: { fontSize: 12, color: '#856404', textAlign: 'right', lineHeight: 18 },
});
