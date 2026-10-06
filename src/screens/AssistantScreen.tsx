import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { llmBridge } from '../ai';
import { askLiveAssistant } from '../ai/LiveAssistant';
import { chatMemory } from '../ai/ChatMemory';
import { buildContextSummary } from '../ai/buildContextSummary';
import { analytics } from '../utils/analytics';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  usedAI?: boolean;
  timestamp: string;
}

const SUGGESTIONS = [
  'حلل شخصية محمد',
  'ما هو الجذر 2؟',
  'اشرح لي الظل في علم الجفر',
  'ما الفرق بين الجذر والكوكب؟',
  'كيف أستخدم التطبيق؟',
];

// ═══ استخراج اسم من السؤال ═══
function extractName(q: string): string | null {
  const BLACKLIST = new Set([
    'شخصية', 'الاسم', 'اسم', 'التحليل', 'تحليل', 'الجفر',
    'التقرير', 'تقرير', 'الموسوعة', 'الكوكب', 'كوكب',
    'البرج', 'برج', 'الجذر', 'جذر', 'الطبع', 'طبع',
    'البيت', 'بيت', 'الرنين', 'رنين', 'الظل', 'ظل',
    'الترياق', 'ترياق', 'المحور', 'محور', 'هذا', 'هذه',
    'التي', 'الذي', 'كيف', 'ماذا', 'لماذا', 'هل', 'ما',
  ]);
  const isName = (w: string) => w.length >= 2 && w.length <= 20 && /^[\u0600-\u06FF]+$/.test(w) && !BLACKLIST.has(w);

  const patterns: RegExp[] = [
    /(?:حلل|حلّل|تحليل|اعرض|اشرح)\s+(?:شخصية|شخصیه|الاسم|اسم|برج|كوكب|جذر|طبع|بيت)\s+([\u0600-\u06FF]{2,20})/,
    /(?:حلل|حلّل|تحليل|اعرض|اشرح)\s+([\u0600-\u06FF]{2,20})/,
    /(?:عن|ل)\s+([\u0600-\u06FF]{2,20})/,
  ];
  for (const p of patterns) {
    const m = q.match(p);
    if (m?.[1]) {
      for (const w of m[1].trim().split(/\s+/)) {
        if (isName(w)) return w;
      }
    }
  }
  return null;
}

export default function AssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('جاهز');
  const [activeName, setActiveName] = useState<string | null>(null);
  const [hasLLM, setHasLLM] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    (async () => {
      const provider = await llmBridge.getProvider();
      const enabled = provider === 'gemini' || provider === 'openai';
      setHasLLM(enabled);
      setStatusMsg(enabled ? `🌐 ${provider}` : '⚠️ لم يُفعَّل AI');
    })();
  }, []);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setStatusMsg('🧠 أفكر...');

    await analytics.trackAiChat();

    try {
      // ═══ استخرج الاسم أو استخدم النشط ═══
      const foundName = extractName(text);
      const name = foundName ?? activeName;

      if (foundName) {
        setActiveName(foundName);
        chatMemory.setName(foundName);
      }

      // ═══ ملخص محاور الاسم (إن وُجد) ═══
      let summary: string | null = null;
      if (name) {
        setStatusMsg(`⚡ أحلّل ${name}...`);
        summary = buildContextSummary(name);
      }

      // ═══ رد حي من الـLLM ═══
      const result = await askLiveAssistant({
        question: text.trim(),
        name,
        contextSummary: summary,
        onProgress: (msg) => setStatusMsg(msg),
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: result.answer,
        usedAI: result.usedAI,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 9).toString(),
          role: 'assistant',
          text: `❌ ${e?.message ?? 'خطأ غير متوقع'}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setStatusMsg('جاهز');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const copyMsg = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('✅', 'تم النسخ');
  };

  const clearChat = () => {
    Alert.alert('محادثة جديدة', 'مسح كل الرسائل؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'مسح',
        style: 'destructive',
        onPress: () => {
          setMessages([]);
          setActiveName(null);
          chatMemory.clear();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>{statusMsg}</Text>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          {activeName && <Text style={styles.nameTag}>👤 {activeName}</Text>}
          {messages.length > 0 && (
            <TouchableOpacity onPress={clearChat}>
              <Ionicons name="refresh-outline" size={18} color="#e74c3c" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView ref={scrollRef} style={styles.chat} contentContainerStyle={{ padding: 12 }}>
        {messages.length === 0 && (
          <View style={styles.welcome}>
            <Text style={styles.welcomeTitle}>🤖 المساعد الحي</Text>
            <Text style={styles.welcomeText}>
              اسأل بحرية كما لو كنت تحادث خبيراً. المساعد يتذكر المحادثة، يفهم السياق، ويجيب مباشرة.
            </Text>
            {!hasLLM && (
              <View style={styles.warnBox}>
                <Text style={styles.warnText}>
                  ⚠️ فعّل مفتاح Gemini أو Groq من الإعدادات لتحادث بحرية
                </Text>
              </View>
            )}
            <Text style={styles.suggestTitle}>جرّب:</Text>
            {SUGGESTIONS.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={styles.suggestionChip}
                onPress={() => send(s)}
              >
                <Text style={styles.suggestionText}>• {s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}
          >
            {msg.role === 'assistant' && (
              <View style={styles.msgHeader}>
                <Text style={styles.badgeText}>
                  {msg.usedAI ? '🌐 حي' : '⚠️ offline'}
                </Text>
                <TouchableOpacity onPress={() => copyMsg(msg.text)}>
                  <Ionicons name="copy-outline" size={14} color="#666" />
                </TouchableOpacity>
              </View>
            )}
            <Text style={[styles.bubbleText, msg.role === 'user' ? styles.userText : styles.aiText]}>
              {msg.text}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={[styles.bubble, styles.aiBubble]}>
            <ActivityIndicator color="#d4af37" />
            <Text style={styles.loadingText}>{statusMsg}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="اكتب رسالتك..."
          placeholderTextColor="#666"
          multiline
          onSubmitEditing={() => send(input)}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => send(input)}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={20} color="#0a1628" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#1a3b5d', borderBottomWidth: 1, borderBottomColor: '#2c5070' },
  statusText: { color: '#d4af37', fontSize: 12, fontWeight: 'bold' },
  nameTag: { color: '#2ecc71', fontSize: 12, fontWeight: 'bold' },

  chat: { flex: 1 },
  welcome: { padding: 20, alignItems: 'center' },
  welcomeTitle: { color: '#d4af37', fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  welcomeText: { color: '#c0c0c0', fontSize: 13, textAlign: 'right', writingDirection: 'rtl', marginBottom: 16, lineHeight: 22 },
  warnBox: { backgroundColor: '#2c1a1a', borderRadius: 8, padding: 10, marginBottom: 14, width: '100%', borderWidth: 1, borderColor: '#e74c3c' },
  warnText: { color: '#e74c3c', fontSize: 12, textAlign: 'right', writingDirection: 'rtl' },
  suggestTitle: { color: '#d4af37', fontSize: 14, marginBottom: 10, alignSelf: 'flex-start' },
  suggestionChip: { backgroundColor: '#1a3b5d', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, marginVertical: 4, alignSelf: 'stretch' },
  suggestionText: { color: '#d4af37', fontSize: 13, textAlign: 'right', writingDirection: 'rtl' },

  bubble: { maxWidth: '94%', marginVertical: 6, padding: 12, borderRadius: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#1abc9c' },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#1a3b5d', borderWidth: 1, borderColor: '#2c5070' },
  bubbleText: { fontSize: 14, lineHeight: 24, textAlign: 'right', writingDirection: 'rtl' },
  userText: { color: '#fff' },
  aiText: { color: '#e8e8e8' },
  msgHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badgeText: { color: '#3498db', fontSize: 10, fontWeight: 'bold' },
  loadingText: { color: '#d4af37', marginTop: 8, fontSize: 12, textAlign: 'right', writingDirection: 'rtl' },

  inputRow: { flexDirection: 'row', padding: 8, backgroundColor: '#0f2438', borderTopWidth: 1, borderTopColor: '#1a3b5d', alignItems: 'flex-end' },
  input: { flex: 1, color: '#fff', backgroundColor: '#1a3b5d', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, maxHeight: 100 },
  sendBtn: { backgroundColor: '#d4af37', borderRadius: 22, width: 44, height: 44, justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
  sendBtnDisabled: { opacity: 0.4 },
});
