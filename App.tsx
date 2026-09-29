import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { KnowledgeBase, importAll } from './src/kb';
import { loadFullEncyclopedia } from './src/data/encyclopediaLoader';

import HomeScreen from './src/screens/HomeScreen';
import ReportScreen from './src/screens/ReportScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import MedicalScreen from './src/screens/MedicalScreen';
import SearchScreen from './src/screens/SearchScreen';
import EntityDetailScreen from './src/screens/EntityDetailScreen';
import AssistantScreen from './src/screens/AssistantScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CompareScreen from './src/screens/CompareScreen';

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
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('جارٍ التهيئة...');

  useEffect(() => {
    const init = async () => {
      try {
        setStatus('جارٍ تهيئة قاعدة المعرفة...');
        await KnowledgeBase.initialize();
        const stats = KnowledgeBase.stats();
        if (stats.totalEntities === 0) {
          setStatus('جارٍ استيراد البيانات...');
          await importAll();
        }
        setStatus('جارٍ تحميل الموسوعة الكبيرة...');
        await loadFullEncyclopedia();
        setReady(true);
      } catch (e: any) {
        setError(e?.message || 'فشل التهيئة');
      }
    };
    init();
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>❌ خطأ في التهيئة</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d4af37" />
        <Text style={styles.loadingText}>{status}</Text>
      </View>
    );
  }

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
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'السجل' }} />
        <Stack.Screen name="EntityDetail" component={EntityDetailScreen} options={{ title: 'تفاصيل الكيان' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a1628', padding: 20 },
  loadingText: { marginTop: 15, fontSize: 16, color: '#d4af37', fontWeight: 'bold' },
  errorText: { fontSize: 20, color: '#e74c3c', marginBottom: 10, fontWeight: 'bold' },
  errorDetail: { fontSize: 14, color: '#c0c0c0', textAlign: 'center' },
});
