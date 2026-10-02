import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { reportChat } from '../ai/ReportChat';
import { llmBridge } from '../ai';
import { LLMBridgeAdapter } from '../ai/LLMBridgeAdapter';
import { ChatMessage } from '../ai/ReportChat';

const SUGGESTED_QUESTIONS = [
  'اشرح لي جذري ببساطة',
  'ما الفرق بين Schism والظل؟',
  'كيف أطبق الترياق عملياً؟',
  'ما أقوى محور عندي ولماذا؟',
  'ما أيام الذروة القادمة؟',
  'لخّص لي التقرير في 3 نقاط',
];

export default function ReportChatScreen({ navigation }: any) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<string>('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    (async () => {
      const p = await llmBridge.getProvider();
      setProvider(p);
      if (!reportChat.isLoaded()) {
        setMessages([
          {
            role: 'assistant',
            content: '⚠️ لم يتم تحميل تقرير. افتح تقريراً أولاً من الشاشة الرئيسية.',
            timestamp: Date.now(),
          },
        ]);
        return;
      }
      const name = reportChat.getReportName();
      setMessages([
        {
          role: 'assistant',
          content: `مرحباً 👋\n\nأنا مساعدك الشخصي للتقريب "${name ?? ''}".\n\nيمكنك سؤالي عن أي قسم من التقرير:\n- الجذر والمحرك\n- الرنين والظل\n- Schism والتقويم\n- الترياق والتوصيات\n\nجرّب أحد الأسئلة المقترحة أدناه.`,
          timestamp: Date.now(),
        },
      ]);
    })();
  }, []);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput('');
    setLoading(true);

    const userMsg: ChatMessage = {
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // إذا كان هناك LLM، نمرره
    if (!reportChat['llmCaller'] && (provider === 'gemini' || provider === 'openai')) {
      // نبني adapter
      const adapter = new LLMBridgeAdapter({
        generate: async (context: any, contextText: string, intent: string) => {
          return await llmBridge.generate(context, contextText, intent);
        },
      });
      (reportChat as any).llmCaller = adapter;
    }

    try {
      const reply = await reportChat.ask(text.trim());
      setMessages((prev) => [...prev, reply]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ خطأ: ${e?.message ?? 'غير معروف'}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const clearChat = () => {
    Alert.alert('مسح الدردشة', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'مسح',
        style: 'destructive',
        onPress: () => {
          reportChat.clear();
          setMessages([
            {
              role: 'assistant',
              content: 'تم مسح الدردشة. ابدأ سؤالاً جديداً.',
              timestamp: Date.now(),
            },
          ]);
        },
      },
    ]);
  };

  const providerLabel = () => {
    if (provider === 'gemini') return '🌐 Gemini';
    if (provider === 'openai') return '🌐 OpenAI';
    if (provider === 'demo') return '🤖 تجريبي';
    return '🔒 محلي';
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>{providerLabel()}</Text>
        {messages.length > 1 && (
          <TouchableOpacity onPress={clearChat}>
            <Text style={styles.clearBtn}>🗑️ مسح</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.chat}
        contentContainerStyle={{ padding: 12 }}
      >
        {messages.length === 1 && (
          <View style={styles.suggestionsBox}>
            <Text style={styles.suggestionsTitle}>أسئلة مقترحة:</Text>
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <TouchableOpacity
                key={i}
                style={styles.suggestionChip}
                onPress={() => send(q)}
              >
                <Text style={styles.suggestionText}>• {q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              msg.role === 'user' ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                msg.role === 'user' ? styles.userText : styles.aiText,
              ]}
            >
              {msg.content}
            </Text>
            {msg.tokensUsed !== undefined && msg.tokensUsed > 0 && (
              <Text style={styles.tokensText}>~{msg.tokensUsed} token</Text>
            )}
            {msg.warning && (
              <Text style={styles.warningText}>⚠️ {msg.warning}</Text>
            )}
          </View>
        ))}

        {loading && (
          <View style={[styles.bubble, styles.aiBubble]}>
            <ActivityIndicator color="#d4af37" />
            <Text style={styles.loadingText}>جارٍ التفكير...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="اكتب سؤالك عن التقرير..."
          placeholderTextColor="#666"
          multiline
          onSubmitEditing={() => send(input)}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => send(input)}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendBtnText}>إرسال</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1a3b5d',
  },
  statusText: { color: '#d4af37', fontSize: 12 },
  clearBtn: { color: '#e74c3c', fontSize: 12 },

  chat: { flex: 1 },

  suggestionsBox: { padding: 10, marginBottom: 12 },
  suggestionsTitle: { color: '#d4af37', fontSize: 14, marginBottom: 8 },
  suggestionChip: {
    backgroundColor: '#1a3b5d',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 4,
  },
  suggestionText: { color: '#d4af37', fontSize: 13 },

  bubble: {
    maxWidth: '92%',
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
  },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#1abc9c' },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#1a3b5d' },
  bubbleText: { fontSize: 14, lineHeight: 22 },
  userText: { color: '#fff' },
  aiText: { color: '#e8e8e8' },
  tokensText: { color: '#7f8c8d', fontSize: 10, marginTop: 4 },
  warningText: { color: '#f39c12', fontSize: 11, marginTop: 4 },
  loadingText: { color: '#d4af37', marginTop: 8, fontSize: 12 },

  inputRow: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#0f2438',
    borderTopWidth: 1,
    borderTopColor: '#1a3b5d',
  },
  input: {
    flex: 1,
    color: '#fff',
    backgroundColor: '#1a3b5d',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#d4af37',
    borderRadius: 20,
    paddingHorizontal: 18,
    justifyContent: 'center',
    marginLeft: 6,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#0a1628', fontWeight: 'bold' },
});
