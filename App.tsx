import 'react-native-gesture-handler';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { DirectionProvider } from './src/utils/DirectionContext';
import { PremiumProvider } from './src/context/PremiumContext';
import { checkPremiumStatus } from './src/storage/premiumStorage';
import FreeRootScreen from './src/screens/FreeRootScreen';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { consentStorage } from './src/utils/consentStorage';
import { analytics } from './src/utils/analytics';
import { FLAGS } from './src/config/featureFlags';
import ComingSoonScreen from './src/screens/ComingSoonScreen';
import AboutScreen from './src/screens/AboutScreen';
import LegalScreen from './src/screens/LegalScreen';
import PaywallScreen from './src/screens/PaywallScreen';
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


function PremiumGuard({ children, isPremium, title }: any) {
  if (isPremium) return children;
  return (
    <View style={{ flex: 1, backgroundColor: '#0a192f', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 60, marginBottom: 20 }}>🔒</Text>
      <Text style={{ color: '#d4af37', fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>{title} مقفل</Text>
      <Text style={{ color: '#e8e8e8', fontSize: 16, textAlign: 'center', lineHeight: 26, marginBottom: 30 }}>
        لقد أتحنا لك "الجذر الحقيقي" مجاناً. للوصول إلى هذا التقرير، يرجى تفعيل العضوية.
      </Text>
      <TouchableOpacity style={{ backgroundColor: '#d4af37', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 25 }} onPress={() => Alert.alert('الاشتراك', 'سيتم توجيهك لبوابة الدفع.')}>
        <Text style={{ color: '#0a192f', fontWeight: 'bold', fontSize: 18 }}>اشترك الآن</Text>
      </TouchableOpacity>
    </View>
  );
}

function MainTabs({ isPremium }: any) {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
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
          title: isPremium ? 'مكتبة' : 'مكتبة 🔒',
          tabBarIcon: ({ color, size }) => <Ionicons name={isPremium ? "library-outline" : "lock-closed-outline"} size={size} color={color} />,
        }}
        listeners={{
        }}
      />
      <Tab.Screen
        name="ResultsTab"
        component={HistoryScreen}
        options={{
          title: isPremium ? 'نتائجي' : 'نتائجي 🔒',
          tabBarIcon: ({ color, size }) => <Ionicons name={isPremium ? "albums-outline" : "lock-closed-outline"} size={size} color={color} />,
        }}
        listeners={{
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  const [consented, setConsented] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [kbReady, setKbReady] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    checkPremiumStatus().then(setIsPremium);
  }, []);

  useEffect(() => {
    
  }, []);

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
      <PremiumProvider>
      <DirectionProvider>
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
        <Stack.Screen name="Main" options={{ headerShown: false }}>
          {(props) => <MainTabs {...props} isPremium={isPremium} />}
        </Stack.Screen>
        <Stack.Screen name="Report" options={{ title: 'التقرير' }}>
          {(props) => <PremiumGuard isPremium={isPremium} title="التقرير العميق"><ReportScreen {...props} /></PremiumGuard>}
        </Stack.Screen>
        <Stack.Screen name="ReportChat" component={ReportChatScreen} options={{ title: '✨ اسأل عن التقرير' }} />
        <Stack.Screen name="FreeRoot" component={FreeRootScreen} options={{ title: 'الجذر الحقيقي (مجاني)' }} />
        <Stack.Screen name="ProductPicker" options={{ title: 'اختر التقرير' }}>
          {(props) => <PremiumGuard isPremium={isPremium} title="اختر التقرير"><ProductPickerScreen {...props} /></PremiumGuard>}
        </Stack.Screen>
        <Stack.Screen name="Compatibility" options={{ title: 'التوافق' }}>
          {(props) => <PremiumGuard isPremium={isPremium} title="التوافق"><CompatibilityScreen {...props} /></PremiumGuard>}
        </Stack.Screen>
        <Stack.Screen name="Brand" options={{ title: 'التشخيص التجاري' }}>
          {(props) => <PremiumGuard isPremium={isPremium} title="التشخيص التجاري"><BrandScreen {...props} /></PremiumGuard>}
        </Stack.Screen>
        <Stack.Screen name="Temporal" options={{ title: 'التقويم الزمني' }}>
          {(props) => <PremiumGuard isPremium={isPremium} title="التقويم الزمني"><TemporalScreen {...props} /></PremiumGuard>}
        </Stack.Screen>
        <Stack.Screen name="Remedy" options={{ title: 'متتبع الالتزام' }}>
          {(props) => <PremiumGuard isPremium={isPremium} title="متتبع الالتزام"><RemedyScreen {...props} /></PremiumGuard>}
        </Stack.Screen>
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'السجل' }} />
        <Stack.Screen name="Assistant" component={AssistantScreen} options={{ title: 'المساعد' }} />
        <Stack.Screen name="TraditionalTab" options={{ title: 'التقليدي' }}>
          {(props) => <PremiumGuard isPremium={isPremium} title="التقرير التقليدي"><TraditionalTabScreen {...props} /></PremiumGuard>}
        </Stack.Screen>
        <Stack.Screen name="Compare" options={{ title: 'المقارنة' }}>
          {(props) => <PremiumGuard isPremium={isPremium} title="المقارنة"><CompareScreen {...props} /></PremiumGuard>}
        </Stack.Screen>
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'الإعدادات' }} />
        <Stack.Screen name="EntityDetail" component={EntityDetailScreen} options={{ title: 'تفاصيل الكيان' }} />
        <Stack.Screen name="TraditionalReport" options={{ title: '📜 التقرير التقليدي' }}>
          {(props) => <PremiumGuard isPremium={isPremium} title="التقرير التقليدي الشامل"><TraditionalReportScreen {...props} /></PremiumGuard>}
        </Stack.Screen>
        <Stack.Screen name="ReflectiveReport" options={{ title: '🧠 الملف النفسي' }}>
          {(props) => <PremiumGuard isPremium={isPremium} title="الملف النفسي"><ReflectiveReportScreen {...props} /></PremiumGuard>}
        </Stack.Screen>
        <Stack.Screen name="ErrorLog" component={ErrorLogScreen} options={{ title: '🔴 سجل الأخطاء' }} />
        <Stack.Screen name="Health" component={HealthScreen} options={{ title: '📊 صحة التطبيق' }} />
        <Stack.Screen name="ExternalKnowledge" component={ExternalKnowledgeScreen} options={{ title: '📚 المعرفة الخارجية' }} />
        <Stack.Screen name="ComingSoon" component={ComingSoonScreen} options={{ title: '🔮 قريباً' }} />
        <Stack.Screen name="About" component={AboutScreen} options={{ title: 'عن التطبيق' }} />
        <Stack.Screen name="Legal" component={LegalScreen} options={{ title: 'وثائق قانونية' }} />
        <Stack.Screen name="Paywall" component={PaywallScreen} options={{ title: 'التجربة المجانية' }} />
        <Stack.Screen name="ImportExternal" component={ImportExternalScreen} options={{ title: '📥 استيراد ملف' }} />
      </Stack.Navigator>
      </NavigationContainer>
      </DirectionProvider>
      </PremiumProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a1628' },
  loadingText: { color: '#d4af37', fontSize: 14, marginTop: 12, fontWeight: 'bold' },
});
