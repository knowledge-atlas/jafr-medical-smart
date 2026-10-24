import 'react-native-gesture-handler';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { consentStorage } from './src/utils/consentStorage';
import { analytics } from './src/utils/analytics';
import { FLAGS } from './src/config/featureFlags';
import ComingSoonScreen from './src/screens/ComingSoonScreen';
import AboutScreen from './src/screens/AboutScreen';
import { importExternalToKB } from './src/kb/importers/externalImporters';

import HomeScreen from './src/screens/HomeScreen';
import ReportScreen from './src/screens/ReportScreen';
import ReportChatScreen from './src/screens/ReportChatScreen';
import ProductPickerScreen from './src/screens/ProductPickerScreen';
import CompatibilityScreen from './src/screens/CompatibilityScreen';
import BrandScreen from './src/screens/BrandScreen';
import TemporalScreen from './src/screens/TemporalScreen';
import RemedyScreen from './src/screens/RemedyScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import MedicalScreen from './src/screens/MedicalScreen';
import SearchScreen from './src/screens/SearchScreen';
import EntityDetailScreen from './src/screens/EntityDetailScreen';
import AssistantScreen from './src/screens/AssistantScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CompareScreen from './src/screens/CompareScreen';
import ConsentScreen from './src/screens/ConsentScreen';
import TraditionalReportScreen from './src/screens/TraditionalReportScreen';
import TraditionalTabScreen from './src/screens/TraditionalTabScreen';
import ReflectiveReportScreen from './src/screens/ReflectiveReportScreen';
import ErrorLogScreen from './src/screens/ErrorLogScreen';
import HealthScreen from './src/screens/HealthScreen';
import OnboardingScreen, { ONBOARDING_STORAGE_KEY } from './src/screens/OnboardingScreen';
import ExternalKnowledgeScreen from './src/screens/ExternalKnowledgeScreen';
import ImportExternalScreen from './src/screens/ImportExternalScreen';
import ErrorBoundary from './src/components/ErrorBoundary';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1a3b5d' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerTitleAlign: 'center',
        tabBarStyle: {
          backgroundColor: '#0f2438',
          borderTopColor: '#1a3b5d',
          height: 62,
          paddingBottom: 8,
          paddingTop: 4,
          flexDirection: 'row-reverse',
        },
        tabBarItemStyle: { flexDirection: 'column' },
        tabBarActiveTintColor: '#d4af37',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: { fontSize: 10, fontWeight: 'bold' },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'تحليل',
          tabBarIcon: ({ color, size }) => <Ionicons name="analytics-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="LibraryTab"
        component={SearchScreen}
        options={{
          title: 'مكتبة',
          tabBarIcon: ({ color, size }) => <Ionicons name="library-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ResultsTab"
        component={HistoryScreen}
        options={{
          title: 'نتائجي',
          tabBarIcon: ({ color, size }) => <Ionicons name="albums-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [consented, setConsented] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [kbReady, setKbReady] = useState(false);

  // ═══ 1) فحص حالة الموافقة + بدء التهيئة الخفيفة ═══
  useEffect(() => {
    const bootstrap = async () => {
      const t0 = Date.now();
      console.log('⏱️ START bootstrap');

      await analytics.trackLaunch();
      const ob = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      setShowOnboarding(ob !== 'true');
      const stored = await consentStorage.get();
      console.log(`⏱️ consent check: ${Date.now() - t0}ms`);
      setConsented(stored === 'accepted');

      // تحميل KB في الخلفية بعد تأخير بسيط
      setTimeout(async () => {
        const tKB = Date.now();
        try {
          const { KnowledgeBase, importAll } = await import('./src/kb');
          console.log(`⏱️ KB import: ${Date.now() - tKB}ms`);
          const tInit = Date.now();
          await KnowledgeBase.initialize();
          console.log(`⏱️ KB init: ${Date.now() - tInit}ms`);
          const stats = KnowledgeBase.stats();
          if (stats.totalEntities === 0) {
            const tImp = Date.now();
            await importAll();
            importExternalToKB(KnowledgeBase);
            console.log(`⏱️ KB importAll: ${Date.now() - tImp}ms`);
          }
          setKbReady(true);
          console.log(`⏱️ TOTAL KB: ${Date.now() - tKB}ms`);
        } catch (e) {
          console.warn('⚠️ KB load failed:', e);
          setKbReady(true);
        }
      }, 50);
    };

    bootstrap();
  }, []);

  const handleAccept = useCallback(async () => {
    await consentStorage.accept();
    setConsented(true);
  }, []);

  const handleDecline = useCallback(async () => {
    await consentStorage.decline();
    setConsented(false);
  }, []);

  if (showOnboarding === true) {
    return <OnboardingScreen onDone={() => setShowOnboarding(false)} />;
  }

  if (consented === null || showOnboarding === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d4af37" />
        <Text style={styles.loadingText}>جارٍ التحميل...</Text>
      </View>
    );
  }

  if (consented === false) {
    return (
      <ConsentScreen
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    );
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
      <Stack.Navigator
        screenOptions={({ navigation }) => ({
          headerStyle: { backgroundColor: '#1a3b5d' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerTitleAlign: 'center',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="settings-outline" size={22} color="#d4af37" />
            </TouchableOpacity>
          ),
        })}
      >
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Report" component={ReportScreen} options={{ title: 'التقرير' }} />
        <Stack.Screen name="ReportChat" component={ReportChatScreen} options={{ title: '✨ اسأل عن التقرير' }} />
        <Stack.Screen name="ProductPicker" component={ProductPickerScreen} options={{ title: 'اختر التقرير' }} />
        <Stack.Screen name="Compatibility" component={CompatibilityScreen} options={{ title: 'التوافق' }} />
        <Stack.Screen name="Brand" component={BrandScreen} options={{ title: 'التشخيص التجاري' }} />
        <Stack.Screen name="Temporal" component={TemporalScreen} options={{ title: 'التقويم الزمني' }} />
        <Stack.Screen name="Remedy" component={RemedyScreen} options={{ title: 'متتبع الالتزام' }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'السجل' }} />
        <Stack.Screen name="Assistant" component={AssistantScreen} options={{ title: 'المساعد' }} />
        <Stack.Screen name="TraditionalTab" component={TraditionalTabScreen} options={{ title: 'التقليدي' }} />
        <Stack.Screen name="Compare" component={CompareScreen} options={{ title: 'المقارنة' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'الإعدادات' }} />
        <Stack.Screen name="EntityDetail" component={EntityDetailScreen} options={{ title: 'تفاصيل الكيان' }} />
        <Stack.Screen name="TraditionalReport" component={TraditionalReportScreen} options={{ title: '📜 التقرير التقليدي' }} />
        <Stack.Screen name="ReflectiveReport" component={ReflectiveReportScreen} options={{ title: '🧠 الملف النفسي' }} />
        <Stack.Screen name="ErrorLog" component={ErrorLogScreen} options={{ title: '🔴 سجل الأخطاء' }} />
        <Stack.Screen name="Health" component={HealthScreen} options={{ title: '📊 صحة التطبيق' }} />
        <Stack.Screen name="ExternalKnowledge" component={ExternalKnowledgeScreen} options={{ title: '📚 المعرفة الخارجية' }} />
        <Stack.Screen name="ComingSoon" component={ComingSoonScreen} options={{ title: '🔮 قريباً' }} />
        <Stack.Screen name="About" component={AboutScreen} options={{ title: 'عن التطبيق' }} />
        <Stack.Screen name="ImportExternal" component={ImportExternalScreen} options={{ title: '📥 استيراد ملف' }} />
      </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a1628' },
  loadingText: { color: '#d4af37', fontSize: 14, marginTop: 12, fontWeight: 'bold' },
});
