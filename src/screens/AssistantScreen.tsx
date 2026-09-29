// ================================================================
// شاشة المساعد الذكي — واجهة المحادثة
// ================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { queryRouter, responseFormatter, llmBridge } from '../ai';
import { AIResponse } from '../ai/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  response?: AIResponse;
  timestamp: string;
}

const SUGGESTIONS = [
  'ما هو الجذر 2؟',
  'حلل شخصية أحمد',
  'ما هو ترياق ظل الجذر 3؟',
  'قارن بين الجذر 1 و 2',
  'ما هي أعراض خلل الجذر 5؟',
];

export default function AssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [llmStatus, setLlmStatus] = useState<string>('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    checkLlmStatus();
  }, []);

  const checkLlmStatus = async () => {
    const provider = await llmBridge.getProvider();
    if (provider === 'none') {
      setLlmStatus('🔒 الوضع المحلي (بدون إنترنت)');
    } else {
      setLlmStatus(`🌐 ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} مفعّل`);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await queryRouter.route(text.trim());
      const formatted = responseFormatter.format(response);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: formatted,
        response,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e: any) {
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        text: `❌ حدث خطأ: ${e.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const clearChat = () => {
    Alert.alert('مسح المحادثة', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'مسح', onPress: () => setMessages([]), style: 'destructive' },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* شريط الحالة */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>{llmStatus}</Text>
        {messages.length > 0 && (
          <TouchableOpacity onPress={clearChat}>
            <Text style={styles.clearBtn}>🗑️ مسح</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* المحادثة */}
      <ScrollView
        ref={scrollRef}
        style={styles.chat}
        contentContainerStyle={{ padding: 12 }}
      >
        {messages.length === 0 && (
          <View style={styles.welcome}>
            <Text style={styles.welcomeTitle}>🤖 المساعد الذكي</Text>
            <Text style={styles.welcomeText}>
              اسأل عن الجذور، الكواكب، الأبراج، البواقي، الترياقات، أو اطلب تحليلاً.
            </Text>
            <Text style={styles.suggestTitle}>جرّب أحد هذه الأسئلة:</Text>
            {SUGGESTIONS.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={styles.suggestionChip}
                onPress={() => sendMessage(s)}
              >
                <Text style={styles.suggestionText}>• {s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {messages.map(msg => (
          <View
            key={msg.id}
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
              {msg.text}
            </Text>

            {/* اقتراحات إضافية */}
            {msg.response?.suggestions && msg.response.suggestions.length > 0 && (
              <View style={styles.suggestionsBox}>
                {msg.response.suggestions.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionChip}
                    onPress={() => sendMessage(s)}
                  >
                    <Text style={styles.suggestionText}>↪ {s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}

        {loading && (
          <View style={[styles.bubble, styles.aiBubble]}>
            <ActivityIndicator color="#d4af37" />
            <Text style={styles.loadingText}>جارٍ البحث في قاعدة المعرفة...</Text>
          </View>
        )}
      </ScrollView>

      {/* الإدخال */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="اكتب سؤالك..."
          placeholderTextColor="#666"
          multiline
          onSubmitEditing={() => sendMessage(input)}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => sendMessage(input)}
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
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#1a3b5d',
  },
  statusText: { color: '#d4af37', fontSize: 12 },
  clearBtn: { color: '#e74c3c', fontSize: 12 },

  chat: { flex: 1 },
  welcome: { padding: 20, alignItems: 'center' },
  welcomeTitle: { color: '#d4af37', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  welcomeText: { color: '#c0c0c0', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  suggestTitle: { color: '#d4af37', fontSize: 14, marginBottom: 10 },

  suggestionChip: {
    backgroundColor: '#1a3b5d', borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 12, marginVertical: 4,
  },
  suggestionText: { color: '#d4af37', fontSize: 13 },

  bubble: {
    maxWidth: '90%', marginVertical: 6, padding: 12, borderRadius: 12,
  },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#1abc9c' },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#1a3b5d' },
  bubbleText: { fontSize: 14, lineHeight: 22 },
  userText: { color: '#fff' },
  aiText: { color: '#e8e8e8' },

  suggestionsBox: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#2c5070', paddingTop: 8 },
  loadingText: { color: '#d4af37', marginTop: 8, fontSize: 12 },

  inputRow: {
    flexDirection: 'row', padding: 8, backgroundColor: '#0f2438',
    borderTopWidth: 1, borderTopColor: '#1a3b5d',
  },
  input: {
    flex: 1, color: '#fff', backgroundColor: '#1a3b5d',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#d4af37', borderRadius: 20,
    paddingHorizontal: 18, justifyContent: 'center', marginLeft: 6,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#0a1628', fontWeight: 'bold' },
});
