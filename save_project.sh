#!/bin/bash

# ================================================================
# سكريبت حفظ واستعادة مشروع المحرك الوجودي الجفري
# تاريخ الحفظ: 2025-09-09
# ================================================================

echo "🔐 بدء حفظ المشروع..."

# إنشاء المجلدات إذا لم تكن موجودة
mkdir -p src/engine src/data src/screens assets

# ================================================================
# 1. ملفات التكوين الأساسية
# ================================================================

# app.json
cat > app.json << 'APP_EOF'
{
  "expo": {
    "name": "المحرك الوجودي الجفري",
    "slug": "my-jafr-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": ["**/*"],
    "ios": { "supportsTablet": true },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.yourcompany.myjafrapp"
    },
    "web": { "favicon": "./assets/favicon.png" }
  }
}
APP_EOF

# tsconfig.json
cat > tsconfig.json << 'TS_EOF'
{
  "compilerOptions": {
    "target": "esnext",
    "module": "commonjs",
    "strict": true,
    "jsx": "react-native",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "exclude": ["node_modules"]
}
TS_EOF

# ================================================================
# 2. ملفات المحرك (engine)
# ================================================================

# abjad.ts
cat > src/engine/abjad.ts << 'ABJAD_EOF'
export const abjadMap: Record<string, number> = (() => {
  const letters = "ابجد هوز حطي كلمن سعفص قرشت ثخذ ضظغ".replace(/\s/g, '');
  const values = [1,2,3,4,5,6,7,8,9,10,20,30,40,50,60,70,80,90,100,200,300,400,500,600,700,800,900,1000];
  const map: Record<string, number> = {};
  for (let i = 0; i < letters.length; i++) {
    map[letters[i]] = values[i];
  }
  map['ة'] = 5;
  map['ى'] = 10;
  return map;
})();

export const extractLetters = (name: string): string[] => {
  return name.split('').filter(c => abjadMap[c] !== undefined);
};

export const calculateAbjad = (name: string) => {
  const letters = extractLetters(name);
  const values = letters.map(l => abjadMap[l]);
  const total = values.reduce((sum, v) => sum + v, 0);
  const digitalRoot = total > 0 ? 1 + (total - 1) % 9 : 0;
  return { letters, values, total, digitalRoot };
};
ABJAD_EOF

# compoundAnalyzer.ts
cat > src/engine/compoundAnalyzer.ts << 'COMP_EOF'
import { COMPOUNDS_FULL_TEXT } from '../data/compounds';
export const analyzeCompounds = (letters: string[]): string[] => {
  const results: string[] = [];
  if (letters.length < 2) return ['لا توجد تراكيب كافية'];
  for (let i = 0; i < letters.length - 1; i++) {
    const key = `${letters[i]}_${letters[i+1]}`;
    const text = COMPOUNDS_FULL_TEXT[key];
    if (text) {
      results.push(`🔹 تركيب (${letters[i]} + ${letters[i+1]}): ${text.substring(0, 100)}...`);
    }
  }
  return results.length ? results : ['لا توجد تراكيب مطابقة'];
};
COMP_EOF

# wafqGenerator.ts
cat > src/engine/wafqGenerator.ts << 'WAFQ_EOF'
export const generateSimpleWafq = (values: number[]): number[][] => {
  const grid: number[][] = [[0,0,0],[0,0,0],[0,0,0]];
  const sorted = [...values].sort((a,b)=>a-b);
  let idx = 0;
  for (let i=0; i<3; i++) {
    for (let j=0; j<3; j++) {
      grid[i][j] = sorted[idx % sorted.length] || 0;
      idx++;
    }
  }
  return grid;
};
export const formatWafq = (grid: number[][]): string => {
  return grid.map(row => row.join(' | ')).join('\n');
};
WAFQ_EOF

# calculator.ts (المعدّل لفصل الطبقات)
cat > src/engine/calculator.ts << 'CALC_EOF'
import { abjadMap, calculateAbjad } from './abjad';
import { getRootData } from '../data/encyclopedia';

const fallbackRootToPlanet: Record<number, string> = {
  1:'شمس',2:'قمر',3:'مشتري',4:'زحل',5:'عطارد',6:'زهرة',7:'نبتون',8:'زحل',9:'مريخ'
};
const fallbackPlanetToSign: Record<string, string> = {
  'شمس':'الأسد','قمر':'السرطان','مشتري':'القوس','زحل':'الجدي','عطارد':'الجوزاء','زهرة':'الميزان','نبتون':'الحوت','مريخ':'الحمل','أورانوس':'الدلو','بلوتو':'العقرب'
};
const fallbackRemainderToHouse: Record<number, number> = {
  0:12,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,10:10,11:11
};
export const houseNames: Record<number, string> = {
  1:'الذات والهوية',2:'المال والقيمة',3:'التواصل والتعليم',4:'الجذور والعائلة',5:'الإبداع والحب',
  6:'العمل والصحة',7:'الشراكة والعقد',8:'التحول والأزمة',9:'الرؤية والسفر',10:'المهنة والسلطة',
  11:'الجماعة والمستقبل',12:'الباطن والعزلة'
};

export const calculate = (name: string) => {
  const { letters, values, total, digitalRoot } = calculateAbjad(name);
  if (letters.length === 0) return { error: 'لا توجد حروف صالحة' };
  const root = total % 9 === 0 ? 9 : total % 9;
  let planet='', sign='', element='', houseId=1, houseName='', mods='';
  try {
    const rootData = getRootData(root);
    if (rootData) {
      element = rootData.operational.element || '';
      planet = rootData.operational.planet || '';
      sign = rootData.operational.sign || '';
      houseId = parseInt(rootData.operational.house,10) || 1;
      houseName = houseNames[houseId] || '';
      mods = rootData.operational.mod7_mod12_mod28 || '';
    } else {
      planet = fallbackRootToPlanet[root] || 'شمس';
      sign = fallbackPlanetToSign[planet] || 'الأسد';
      element = 'تراب';
      houseId = fallbackRemainderToHouse[total % 12] || 1;
      houseName = houseNames[houseId] || '';
    }
  } catch(e) {
    planet = fallbackRootToPlanet[root] || 'شمس';
    sign = fallbackPlanetToSign[planet] || 'الأسد';
    element = 'تراب';
    houseId = fallbackRemainderToHouse[total % 12] || 1;
    houseName = houseNames[houseId] || '';
  }
  return {
    letters, values, total, digitalRoot, root, planet, sign, element,
    houseId, houseName,
    remainders: {
      on9: root,
      on7: total % 7 === 0 ? 7 : total % 7,
      on12: total % 12 === 0 ? 12 : total % 12,
      on28: total % 28 === 0 ? 28 : total % 28
    },
    mods
  };
};
CALC_EOF

# reportBuilder.ts (مع فصل الطبقات)
cat > src/engine/reportBuilder.ts << 'REPORT_EOF'
import { calculate } from './calculator';
import { analyzeCompounds } from './compoundAnalyzer';
import { generateSimpleWafq, formatWafq } from './wafqGenerator';
import { getRootFullText, getRootMods, getResonance, getRemediesForRoot, getRootData } from '../data/encyclopedia';
import { ROOTS_FULL_TEXT as FALLBACK_ROOTS } from '../data/roots';
import { PLANETS_FULL_TEXT as FALLBACK_PLANETS } from '../data/planets';
import { SIGNS_FULL_TEXT as FALLBACK_SIGNS } from '../data/signs';
import { ELEMENTS_FULL_TEXT as FALLBACK_ELEMENTS } from '../data/elements';
import { HOUSES_FULL_TEXT as FALLBACK_HOUSES } from '../data/houses';
import { REMAINDERS_FULL_TEXT as FALLBACK_REMAINDERS } from '../data/remainders';
import { RESONANCE_FULL_TEXT as FALLBACK_RESONANCE } from '../data/resonance';
import { REMEDIES_TYPES_FULL as FALLBACK_REMEDIES } from '../data/remedies';
import { LETTERS_FULL_TEXT as FALLBACK_LETTERS } from '../data/letters';

const mod7Interpretation: Record<number,string> = {0:'زحل',1:'الشمس',2:'القمر',3:'المريخ',4:'عطارد',5:'المشتري',6:'الزهرة'};
const mod4Interpretation: Record<number,string> = {0:'تراب',1:'نار',2:'هواء',3:'ماء'};
const mod12Interpretation: Record<number,string> = {
  0:'الحوت',1:'الحمل',2:'الثور',3:'الجوزاء',4:'السرطان',5:'الأسد',
  6:'العذراء',7:'الميزان',8:'العقرب',9:'القوس',10:'الجدي',11:'الدلو'
};

export const buildReport = (name: string, symptoms: string[] = []) => {
  const calc = calculate(name);
  if ('error' in calc) return { error: calc.error };
  const { root, planet, sign, element } = calc;

  let rootText='', planetText='', signText='', elementText='', houseText='', rootResonance='', rootRemedy='';
  try {
    rootText = getRootFullText(root) || FALLBACK_ROOTS[root] || 'نص الجذر غير متوفر';
    planetText = FALLBACK_PLANETS[planet] || 'نص الكوكب غير متوفر';
    signText = FALLBACK_SIGNS[sign] || 'نص البرج غير متوفر';
    elementText = FALLBACK_ELEMENTS[element] || 'نص الطبع غير متوفر';
    houseText = FALLBACK_HOUSES[calc.houseId] || 'نص البيت غير متوفر';
    rootResonance = getResonance(root, root) || FALLBACK_RESONANCE[`${root}_${root}`] || 'رنين غير متوفر';
    const remedies = getRemediesForRoot(root);
    rootRemedy = remedies.length ? `الجذور ${remedies.join('، ')}` : FALLBACK_REMEDIES['ترياق التثبيت'] || 'مراجعة النص';
  } catch(e) {
    rootText = FALLBACK_ROOTS[root] || 'نص الجذر غير متوفر';
    planetText = FALLBACK_PLANETS[planet] || 'نص الكوكب غير متوفر';
    signText = FALLBACK_SIGNS[sign] || 'نص البرج غير متوفر';
    elementText = FALLBACK_ELEMENTS[element] || 'نص الطبع غير متوفر';
    houseText = FALLBACK_HOUSES[calc.houseId] || 'نص البيت غير متوفر';
    rootResonance = FALLBACK_RESONANCE[`${root}_${root}`] || 'رنين غير متوفر';
    rootRemedy = FALLBACK_REMEDIES['ترياق التثبيت'] || 'مراجعة النص';
  }

  const mod7Interpreted = mod7Interpretation[calc.remainders.on7] || 'غير محدد';
  const mod12Interpreted = mod12Interpretation[calc.remainders.on12] || 'غير محدد';
  const mod4Interpreted = mod4Interpretation[calc.total % 4] || 'غير محدد';

  const remainder9Text = FALLBACK_REMAINDERS[calc.remainders.on9] || 'نص الباقي على 9 غير متوفر';
  const remainder7Text = FALLBACK_REMAINDERS[calc.remainders.on7] || 'نص الباقي على 7 غير متوفر';
  const remainder12Text = FALLBACK_HOUSES[calc.remainders.on12] || 'نص الباقي على 12 غير متوفر';
  const remainder28Text = FALLBACK_LETTERS[calc.remainders.on28] || FALLBACK_REMAINDERS[calc.remainders.on28] || 'نص الباقي على 28 غير متوفر';

  const compounds = analyzeCompounds(calc.letters);
  const wafqGrid = generateSimpleWafq(calc.values);
  const wafqStr = formatWafq(wafqGrid);
  const rootTitle = rootText.split('\n')[0] || `الجذر ${root}`;

  const fullReport = `
============================================================
            التقرير الجفري-النفسي الشامل
                     ${name}
============================================================

╔═══════════════════════════════════════════════════════════╗
║              🔹 الطبقة الأولى: الجذر (النواة الثابتة)    ║
╚═══════════════════════════════════════════════════════════╝

**الجذر الحقيقي: ${root}**
${rootText}

**المحرك الكوكبي: ${planet}**
${planetText}

**أسلوب التعبير البرجي: ${sign}**
${signText}

**المادة الحركية (الطبع): ${element}**
${elementText}

**مجال العمل (البيت): ${calc.houseId} - ${calc.houseName}**
${houseText}

**الرنين الداخلي للجذر:**
${rootResonance}

**الترياق الأساسي:**
${rootRemedy}


╔═══════════════════════════════════════════════════════════╗
║              🔸 الطبقة الثانية: البواقي الحسابية (Mod)  ║
╚═══════════════════════════════════════════════════════════╝

**الميزان العددي:**
- الحروف: ${calc.letters.join('، ')}
- القيم: ${calc.values.join('، ')}
- المجموع: ${calc.total}
- الجذر الرقمي: ${calc.digitalRoot}

**البواقي وتفسيرها:**

📘 **باقي 9 = ${calc.remainders.on9}** → الجذر (النواة)
   ${remainder9Text}

📗 **باقي 7 = ${calc.remainders.on7}** → ${mod7Interpreted}
   (هذا باقي كوكبي مستقل، لا يُحدد كوكب الجذر)
   ${remainder7Text}

📙 **باقي 12 = ${calc.remainders.on12}** → ${mod12Interpreted}
   (هذا باقي برجي مستقل، يُستخدم لتحديد البيت أكثر من البرج الرئيسي)
   ${remainder12Text}

📕 **باقي 28 = ${calc.remainders.on28}** → الحرف الحاكم
   ${remainder28Text}

📊 **باقي 4 = ${calc.total % 4}** → ${mod4Interpreted}
   (هذا باقي طبعي مستقل، لا يُحدد طبع الجذر)


╔═══════════════════════════════════════════════════════════╗
║              🔹 التراكيب والأوفاق                       ║
╚═══════════════════════════════════════════════════════════╝

**التراكيب الثنائية المستخلصة من الاسم:**
${compounds.join('\n')}

**الوفق البسيط (المربع العددي):**
${wafqStr}

${symptoms.length > 0 ? `\n**الأعراض المدخلة:** ${symptoms.join('، ')}` : ''}

╔═══════════════════════════════════════════════════════════╗
║              📌 خلاصة التشخيص                           ║
╚═══════════════════════════════════════════════════════════╝

- **الجذر الأساسي:** ${root} (${rootTitle})
- **الكوكب الحقيقي (من الجذر):** ${planet}
- **البرج الحقيقي (من الجذر):** ${sign}
- **الطبع الحقيقي (من الجذر):** ${element}
- **البيت (من باقي 12):** ${calc.houseId} - ${calc.houseName}
- **الكوكب من باقي 7:** ${mod7Interpreted} (طبقة مستقلة)
- **البرج من باقي 12:** ${mod12Interpreted} (طبقة مستقلة)
- **الطبع من باقي 4:** ${mod4Interpreted} (طبقة مستقلة)

**التوصية النهائية:**
بناءً على الجذر ${root}، يحتاج هذا الكيان إلى تحقيق التوازن عبر ترياقه الخاص.
${rootRemedy}
============================================================
`;

  return {
    entity: name,
    root, rootTitle, planet, sign, element, house: calc.houseName,
    fullReport, calculation: calc,
    compounds, wafq: wafqStr,
    mod7Interpreted, mod12Interpreted, mod4Interpreted,
    dataRetention: 'فصل الطبقات بوضوح – جذر + بواقي مستقلة'
  };
};
REPORT_EOF

# ================================================================
# 3. طبقة تحميل JSON (encyclopedia.ts)
# ================================================================

cat > src/data/encyclopedia.ts << 'ENC_EOF'
import rawData from './jafr_encyclopedia_FULL_v2.json';

type RootEntry = { id: string; number: number; title: string; reference_text: string; operational: { letter: string; element: string; planet: string; sign: string; house: string; shadow: string; weakness: string; remedy: string; mod7_mod12_mod28: string; }; };
type LetterEntry = { id: string; glyph: string; abjad_value: number; element_model_cycle: string; cycle_position: number; expanded_value_model: number; };
type ResonancePair = { root_a: number; root_b: number; raw_row: string; };
type RemedyMap = { [root: string]: { defect: string; remedies: number[]; }; };
type EncyclopediaData = { schema_version: string; title: string; letters: LetterEntry[]; roots: RootEntry[]; resonance_pairs_36: ResonancePair[]; remedy_map: RemedyMap; };

const data = rawData as EncyclopediaData;

export const getRootData = (rootNumber: number): RootEntry | null => data.roots.find(r => r.number === rootNumber) || null;
export const getRootFullText = (rootNumber: number): string => getRootData(rootNumber)?.reference_text || '';
export const getRootLetter = (rootNumber: number): string => getRootData(rootNumber)?.operational.letter || '';
export const getRootElement = (rootNumber: number): string => getRootData(rootNumber)?.operational.element || '';
export const getRootPlanet = (rootNumber: number): string => getRootData(rootNumber)?.operational.planet || '';
export const getRootSign = (rootNumber: number): string => getRootData(rootNumber)?.operational.sign || '';
export const getRootHouse = (rootNumber: number): string => getRootData(rootNumber)?.operational.house || '';
export const getRootShadow = (rootNumber: number): string => getRootData(rootNumber)?.operational.shadow || '';
export const getRootWeakness = (rootNumber: number): string => getRootData(rootNumber)?.operational.weakness || '';
export const getRootRemedy = (rootNumber: number): string => getRootData(rootNumber)?.operational.remedy || '';
export const getRootMods = (rootNumber: number): string => getRootData(rootNumber)?.operational.mod7_mod12_mod28 || '';
export const getLetterByAbjad = (abjadValue: number): LetterEntry | null => data.letters.find(l => l.abjad_value === abjadValue) || null;
export const getResonance = (a: number, b: number): string => data.resonance_pairs_36.find(p => p.root_a === a && p.root_b === b)?.raw_row || '';
export const getRemediesForRoot = (rootNumber: number): number[] => data.remedy_map[rootNumber.toString()]?.remedies || [];
export const encyclopediaData = data;
ENC_EOF

# ================================================================
# 4. ملفات البيانات (data) - تحتوي كلها هنا (مقتطفات كبيرة)
# ================================================================
# بما أن ملفات البيانات ضخمة، تم حذف محتواها هنا للاختصار،
# لكن المستخدم يمتلكها بالفعل. سيتم حفظها عبر النسخ الاحتياطي اليدوي أو
# يمكن إعادة إنشائها من الأوامر السابقة في المحادثة.
# لكننا سنضمن وجود ملفات أساسية مثل roots.ts, planets.ts إلخ.

echo "⚠️ ملفات البيانات (roots.ts, planets.ts, ...) يجب حفظها بشكل منفصل لأنها كبيرة."
echo "✅ تم حفظ الملفات الأساسية والمحرك والشاشات."

# ================================================================
# 5. الشاشات (screens)
# ================================================================

# HomeScreen.tsx (مع أزرار الأعراض)
cat > src/screens/HomeScreen.tsx << 'HOME_EOF'
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildReport } from '../engine/reportBuilder';

const commonSymptoms = ['تشتت', 'جمود', 'استنزاف', 'غضب', 'خوف', 'تردد', 'قسوة', 'عزلة', 'مبالغة', 'اندفاع'];

export default function HomeScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [savedReports, setSavedReports] = useState<any[]>([]);

  useEffect(() => { loadSavedReports(); }, []);

  const loadSavedReports = async () => {
    try { const data = await AsyncStorage.getItem('reports'); if (data) setSavedReports(JSON.parse(data)); } catch {}
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]);
  };

  const handleAnalyze = () => {
    if (!name.trim()) { Alert.alert('⚠️ تنبيه', 'الرجاء إدخال اسم.'); return; }
    const result = buildReport(name, selectedSymptoms);
    if (result.error) { Alert.alert('❌ خطأ', result.error); return; }
    navigation.navigate('Report', { report: result });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🔮 المحرك الوجودي الجفري</Text>
      <Text style={styles.subtitle}>أدخل اسمك لتحليل شخصيتك</Text>
      <Text style={styles.label}>👤 الاسم:</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="مثال: محمد" placeholderTextColor="#999" />
      <Text style={styles.label}>🤔 الأعراض:</Text>
      <View style={styles.symptomsContainer}>
        {commonSymptoms.map(s => (
          <TouchableOpacity key={s} style={[styles.symptomButton, selectedSymptoms.includes(s) && styles.symptomSelected]} onPress={() => toggleSymptom(s)}>
            <Text style={[styles.symptomText, selectedSymptoms.includes(s) && styles.symptomTextSelected]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze}><Text style={styles.buttonText}>🔍 تحليل</Text></TouchableOpacity>
      <TouchableOpacity style={styles.historyButton} onPress={() => navigation.navigate('History', { reports: savedReports })}><Text style={styles.buttonText}>📂 سجل التقارير ({savedReports.length})</Text></TouchableOpacity>
      <Text style={styles.footer}>© 2025 - المحرك الوجودي الجفري v2.1</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#f0f4f8' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#1a3b5d', marginTop: 20 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#34495e', marginBottom: 30 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginTop: 15 },
  input: { borderWidth: 1, borderColor: '#bdc3c7', borderRadius: 10, padding: 12, marginTop: 5, backgroundColor: '#fff', fontSize: 16 },
  symptomsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  symptomButton: { backgroundColor: '#ecf0f1', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 15, margin: 5 },
  symptomSelected: { backgroundColor: '#3498db' },
  symptomText: { color: '#2c3e50' },
  symptomTextSelected: { color: '#fff' },
  analyzeButton: { backgroundColor: '#27ae60', padding: 15, borderRadius: 10, marginTop: 20 },
  historyButton: { backgroundColor: '#8e44ad', padding: 15, borderRadius: 10, marginTop: 10 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 18 },
  footer: { textAlign: 'center', marginTop: 30, color: '#7f8c8d' }
});
HOME_EOF

# ReportScreen.tsx (مع نسخ وتصدير)
cat > src/screens/ReportScreen.tsx << 'REP_EOF'
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function ReportScreen({ route, navigation }: any) {
  const { report } = route.params;
  const [saved, setSaved] = useState(false);

  const saveReport = async () => {
    try {
      const existing = await AsyncStorage.getItem('reports');
      const reports = existing ? JSON.parse(existing) : [];
      reports.push({ id: Date.now(), entity: report.entity, date: new Date().toLocaleString(), summary: report.fullReport.substring(0,200)+'...', full: report.fullReport });
      await AsyncStorage.setItem('reports', JSON.stringify(reports));
      setSaved(true);
      Alert.alert('✅ تم الحفظ', 'تم حفظ التقرير.');
    } catch (e) { Alert.alert('❌ خطأ', 'فشل الحفظ.'); }
  };

  const copyToClipboard = async () => {
    try { await Clipboard.setStringAsync(report.fullReport); Alert.alert('📋 تم النسخ', 'تم نسخ التقرير.'); } catch { Alert.alert('❌ خطأ', 'فشل النسخ.'); }
  };

  const shareReport = async () => {
    try {
      const fileName = `تقرير_${report.entity}_${Date.now()}.txt`;
      const filePath = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(filePath, report.fullReport, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(filePath, { mimeType: 'text/plain', dialogTitle: 'مشاركة التقرير' });
      else Alert.alert('⚠️ تنبيه', 'المشاركة غير متوفرة.');
    } catch { Alert.alert('❌ خطأ', 'فشل التصدير.'); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>📜 التقرير الكامل</Text>
      <View style={styles.card}><Text style={styles.label}>👤 الاسم</Text><Text style={styles.value}>{report.entity}</Text></View>
      <View style={styles.card}><Text style={styles.label}>🧬 الجذر</Text><Text style={styles.value}>{report.root} - {report.rootTitle}</Text></View>
      <View style={styles.card}><Text style={styles.label}>🪐 الكوكب</Text><Text style={styles.value}>{report.planet}</Text></View>
      <View style={styles.card}><Text style={styles.label}>♈ البرج</Text><Text style={styles.value}>{report.sign}</Text></View>
      <View style={styles.card}><Text style={styles.label}>🔥 الطبع</Text><Text style={styles.value}>{report.element}</Text></View>
      <View style={styles.card}><Text style={styles.label}>🏠 البيت</Text><Text style={styles.value}>{report.house}</Text></View>
      <View style={styles.card}><Text style={styles.label}>📊 الميزان العددي</Text>
        <Text style={styles.value}>المجموع: {report.calculation.total}</Text>
        <Text style={styles.value}>الجذر الرقمي: {report.calculation.digitalRoot}</Text>
        <Text style={styles.value}>البواقي: 9={report.calculation.remainders.on9}, 7={report.calculation.remainders.on7}, 12={report.calculation.remainders.on12}, 28={report.calculation.remainders.on28}</Text>
      </View>
      {report.compounds && report.compounds.length>0 && <View style={styles.card}><Text style={styles.label}>🔹 التراكيب</Text>{report.compounds.map((c: string, i: number) => <Text key={i} style={styles.bullet}>• {c}</Text>)}</View>}
      {report.wafq && <View style={styles.card}><Text style={styles.label}>🔢 الوفق</Text><Text style={styles.wafq}>{report.wafq}</Text></View>}
      <View style={styles.card}><Text style={styles.label}>📝 التقرير النصي</Text><Text style={styles.fullText}>{report.fullReport}</Text></View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={saveReport}><Text style={styles.buttonText}>{saved?'✅ محفوظ':'💾 حفظ'}</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.copyButton]} onPress={copyToClipboard}><Text style={styles.buttonText}>📋 نسخ</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.shareButton]} onPress={shareReport}><Text style={styles.buttonText}>📤 تصدير</Text></TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.buttonText}>🔙 العودة</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding:20, backgroundColor:'#f0f4f8' },
  header: { fontSize:24, fontWeight:'bold', textAlign:'center', marginBottom:20, color:'#1a3b5d' },
  card: { backgroundColor:'#fff', borderRadius:12, padding:15, marginBottom:15, shadowColor:'#000', shadowOpacity:0.1, shadowRadius:4, elevation:3 },
  label: { fontSize:16, fontWeight:'bold', color:'#2c3e50', marginBottom:5 },
  value: { fontSize:16, color:'#34495e', marginBottom:3 },
  bullet: { fontSize:14, color:'#2c3e50', marginLeft:10, marginBottom:2 },
  wafq: { fontSize:18, fontFamily:'monospace', textAlign:'center', backgroundColor:'#ecf0f1', padding:10, borderRadius:8 },
  fullText: { fontSize:14, lineHeight:22, color:'#2c3e50', textAlign:'justify' },
  buttonRow: { flexDirection:'row', justifyContent:'space-between', marginTop:10, gap:10 },
  actionButton: { flex:1, padding:12, borderRadius:10, alignItems:'center' },
  saveButton: { backgroundColor:'#27ae60' },
  copyButton: { backgroundColor:'#2980b9' },
  shareButton: { backgroundColor:'#8e44ad' },
  buttonText: { color:'#fff', fontWeight:'bold', fontSize:14 },
  backButton: { backgroundColor:'#7f8c8d', padding:15, borderRadius:10, marginTop:10 }
});
REP_EOF

# HistoryScreen.tsx (مع تصدير السجل)
cat > src/screens/HistoryScreen.tsx << 'HIST_EOF'
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function HistoryScreen({ navigation }: any) {
  const [reports, setReports] = useState<any[]>([]);
  useEffect(() => { loadReports(); const unsubscribe = navigation.addListener('focus', loadReports); return unsubscribe; }, [navigation]);
  const loadReports = async () => { try { const data = await AsyncStorage.getItem('reports'); if (data) setReports(JSON.parse(data)); } catch {} };
  const clearHistory = async () => {
    Alert.alert('⚠️ تأكيد', 'حذف جميع التقارير؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => { await AsyncStorage.removeItem('reports'); setReports([]); } }
    ]);
  };
  const exportAllReports = async () => {
    if (reports.length === 0) { Alert.alert('⚠️ تنبيه', 'لا توجد تقارير.'); return; }
    try {
      let fullText = `سجل التقارير الجفرية\nعدد التقارير: ${reports.length}\nتاريخ: ${new Date().toLocaleString()}\n\n`;
      reports.forEach((r,i) => {
        fullText += `--- التقرير ${i+1} ---\nالاسم: ${r.entity}\nالتاريخ: ${r.date}\nالملخص: ${r.summary}\nالتفاصيل:\n${r.full}\n\n`;
      });
      const fileName = `سجل_التقارير_${Date.now()}.txt`;
      const filePath = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(filePath, fullText, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(filePath, { mimeType: 'text/plain', dialogTitle: 'مشاركة السجل' });
      else Alert.alert('⚠️ تنبيه', 'المشاركة غير متوفرة.');
    } catch { Alert.alert('❌ خطأ', 'فشل التصدير.'); }
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>📂 سجل التقارير</Text>
      {reports.length === 0 ? <Text style={styles.empty}>لا توجد تقارير.</Text> : (
        <>
          <TouchableOpacity style={styles.exportAllButton} onPress={exportAllReports}><Text style={styles.buttonText}>📤 تصدير الكل ({reports.length})</Text></TouchableOpacity>
          {reports.map((r,i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.name}>👤 {r.entity}</Text>
              <Text style={styles.date}>📅 {r.date}</Text>
              <Text style={styles.summary}>{r.summary}</Text>
              <TouchableOpacity style={styles.viewButton} onPress={() => navigation.navigate('Report', { report: { ...r, fullReport: r.full } })}><Text style={styles.buttonText}>عرض التفاصيل</Text></TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.clearButton} onPress={clearHistory}><Text style={styles.buttonText}>🗑️ مسح</Text></TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { padding:20, backgroundColor:'#f0f4f8' },
  header: { fontSize:24, fontWeight:'bold', textAlign:'center', marginBottom:20, color:'#1a3b5d' },
  empty: { textAlign:'center', fontSize:16, color:'#7f8c8d', marginTop:50 },
  card: { backgroundColor:'#fff', borderRadius:12, padding:15, marginBottom:15, shadowColor:'#000', shadowOpacity:0.1, shadowRadius:4, elevation:3 },
  name: { fontSize:18, fontWeight:'bold', color:'#2c3e50' },
  date: { fontSize:14, color:'#7f8c8d', marginBottom:5 },
  summary: { fontSize:14, color:'#34495e' },
  viewButton: { backgroundColor:'#3498db', padding:10, borderRadius:8, marginTop:10, alignSelf:'flex-start' },
  clearButton: { backgroundColor:'#e74c3c', padding:15, borderRadius:10, marginTop:20 },
  exportAllButton: { backgroundColor:'#27ae60', padding:15, borderRadius:10, marginBottom:15 },
  buttonText: { color:'#fff', fontWeight:'bold', textAlign:'center' }
});
HIST_EOF

# App.tsx
cat > App.tsx << 'APP_EOF'
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import ReportScreen from './src/screens/ReportScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Stack = createStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'الرئيسية' }} />
        <Stack.Screen name="Report" component={ReportScreen} options={{ title: 'التقرير' }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'السجل' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
APP_EOF

# ================================================================
# 6. ملفات البيانات الكبيرة (منسوخة من النسخ الاحتياطية الموجودة)
# ================================================================
# تنبيه: هذه الملفات ضخمة، لذا نكتفي بإنشاء ملفات فارغة ونطلب من المستخدم
# نسخها من النسخ الاحتياطية أو من أوامر سابقة.
# لكننا سنضمن وجود ملفات أساسية فارغة لمنع أخطاء الاستيراد.
touch src/data/roots.ts src/data/planets.ts src/data/signs.ts src/data/elements.ts src/data/houses.ts src/data/remainders.ts src/data/wafq.ts src/data/compounds.ts src/data/remedies.ts src/data/resonance.ts src/data/letters.ts

echo "✅ تم إنشاء ملفات البيانات فارغة. يجب استعادة محتواها من النسخ الاحتياطية."

# ================================================================
# 7. سكريبت البناء build.sh
# ================================================================

cat > build.sh << 'BUILD_EOF'
#!/bin/bash
echo "🔨 بدء إخراج التطبيق..."
npx expo install react-dom react-native-web
npx expo start -c --no-dev &
sleep 5
kill %1 2>/dev/null
npx expo export:web
if [ -d "web-build" ]; then tar -czf jafr-web.tar.gz web-build/; echo "✅ تم ضغط نسخة الويب."; else echo "⚠️ لم يتم العثور على web-build"; fi
echo "📱 لبناء APK: npx eas build --platform android --profile preview"
echo "✅ اكتملت العمليات الأساسية."
BUILD_EOF

chmod +x build.sh

# ================================================================
# 8. تثبيت التبعيات
# ================================================================

echo "📦 تثبيت التبعيات الضرورية..."
npx expo install @react-navigation/native @react-navigation/stack react-native-screens react-native-safe-area-context react-native-gesture-handler @react-native-async-storage/async-storage expo-clipboard expo-sharing expo-file-system

echo ""
echo "✅ تم حفظ المشروع بنجاح!"
echo "📌 الملاحظات:"
echo "   - ملفات البيانات الكبيرة (roots.ts, planets.ts, ...) تم إنشاؤها فارغة."
echo "   - يجب استعادة محتواها من النسخ الاحتياطية أو من أوامر المحادثة السابقة."
echo "   - ملف jafr_encyclopedia_FULL_v2.json يجب وضعه في src/data/ يدوياً."
echo "   - لتشغيل التطبيق: npx expo start"
echo "   - لبناء APK: ./build.sh أو npx eas build --platform android --profile preview"
echo "🔐 حفظ المشروع اكتمل."
