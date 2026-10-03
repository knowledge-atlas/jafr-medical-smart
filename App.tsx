import 'react-native-gesture-handler';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, InteractionManager } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const CONSENT_KEY = '@knowledgeatlas/consent_v1';

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
        },
        tabBarActiveTintColor: '#d4af37',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: { fontSize: 10, fontWeight: 'bold' },
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen}
        options={{ title: 'الرئيسية', tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tab.Screen name="SearchTab" component={SearchScreen}
        options={{ title: 'البحث', tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} /> }} />
      <Tab.Screen name="AssistantTab" component={AssistantScreen}
        options={{ title: 'المساعد', tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} /> }} />
      <Tab.Screen name="CompareTab" component={CompareScreen}
        options={{ title: 'المقارنة', tabBarIcon: ({ color, size }) => <Ionicons name="git-compare" size={size} color={color} /> }} />
      <Tab.Screen name="MedicalTab" component={MedicalScreen}
        options={{ title: 'الطبية', tabBarIcon: ({ color, size }) => <Ionicons name="medkit" size={size} color={color} /> }} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen}
        options={{ title: 'الإعدادات', tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [consented, setConsented] = useState<boolean | null>(null);
  const [kbReady, setKbReady] = useState(false);
  const [encyclopediaLoaded, setEncyclopediaLoaded] = useState(false);

  // ═══ 1) فحص حالة الموافقة + بدء التهيئة الخفيفة ═══
  useEffect(() => {
    const bootstrap = async () => {
      // 1. فحص الموافقة
      try {
        const stored = await AsyncStorage.getItem(CONSENT_KEY);
        setConsented(stored === 'accepted');
      } catch {
        setConsented(false);
      }

      // 2. تحميل KB في الخلفية (لا يُوقف الواجهة)
      InteractionManager.runAfterInteractions(async () => {
        try {
          const { KnowledgeBase, importAll } = await import('./src/kb');
          await KnowledgeBase.initialize();
          const stats = KnowledgeBase.stats();
          if (stats.totalEntities === 0) {
            await importAll();
          }
          setKbReady(true);
        } catch (e) {
          console.warn('⚠️ KB load failed:', e);
          setKbReady(true); // نسمح بالمتابعة
        }
      });
    };

    bootstrap();
  }, []);

  // ═══ 2) تحميل الموسوعة الكبيرة — بشكل كسول (Lazy) ═══
  useEffect(() => {
    if (!kbReady || encyclopediaLoaded) return;
    if (!consented) return;

    InteractionManager.runAfterInteractions(async () => {
      try {
        const { loadFullEncyclopedia } = await import('./src/data/encyclopediaLoader');
        await loadFullEncyclopedia();
        setEncyclopediaLoaded(true);
      } catch (e) {
        console.warn('⚠️ Encyclopedia load failed:', e);
        setEncyclopediaLoaded(true);
      }
    });
  }, [kbReady, consented, encyclopediaLoaded]);

  const handleAccept = useCallback(async () => {
    try {
      await AsyncStorage.setItem(CONSENT_KEY, 'accepted');
    } catch {}
    setConsented(true);
  }, []);

  const handleDecline = useCallback(() => {
    // لا نستخدم BackHandler هنا — يمكن للمستخدم إغلاق التطبيق يدوياً
    setConsented(false);
  }, []);

  // ═══ 3) عرض شاشة الموافقة أولاً ═══
  if (consented === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d4af37" />
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

  // ═══ 4) عرض التطبيق مباشرة (KB يُحمّل في الخلفية) ═══
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#1a3b5d' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerTitleAlign: 'center',
        }}
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
        <Stack.Screen name="EntityDetail" component={EntityDetailScreen} options={{ title: 'تفاصيل الكيان' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a1628' },
});
