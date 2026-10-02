import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { queryRouter, responseFormatter, llmBridge, HybridEngine } from '../ai';
import { AIResponse } from '../ai/types';
import { createRealAnalyzeNameUseCase } from '../application/di';
import { routeAssistantText } from './assistantRouter';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  response?: AIResponse;
  layer?: 'A' | 'B' | 'C';
  offline?: boolean;
  warnings?: string[];
  timestamp: string;
}

const SUGGESTIONS = [
  'حلل شخصية أحمد',
  'ما هو الجفر؟',
  'قارن بين الجذر 1 و 2',
  'حلل محمد',
  'ما هي أعراض خلل الجذر 5؟',
];

const hybridEngine = new HybridEngine({
  analyzer: createRealAnalyzeNameUseCase(),
  llmCaller: {
    generate: async (system, user) => {
      const provider = await llmBridge.getProvider();
      if (provider === 'none') {
        return { answer: '', tokensUsed: 0 };
      }
      const result = await llmBridge.generate(
        { question: user, entities: [], relations: [] } as any,
        system + '\n\n' + user,
        'analytical'
      );
      return result ?? { answer: '', tokensUsed: 0 };
    },
  },
});

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
      setLlmStatus('🔒 وضع محلي (بدون إنترنت)');
    } else if (provider === 'demo') {
      setLlmStatus('🤖 وضع تجريبي');
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
      const route = routeAssistantText(text.trim());

      if (route.decision === 'hybrid' && route.name) {
        const result = await hybridEngine.process({
          question: text.trim(),
          nameForAnalysis: route.name,
          mode: route.mode,
        });

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: result.answer,
          layer: result.layer,
          offline: result.offline,
          warnings: result.warnings,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        const response = await queryRouter.route(text.trim());
        const formatted = responseFormatter.format(response);
        const aiMsg: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          text: formatted,
          response,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (e: any) {
      const errorMsg: Message = {
        id: (Date.now() + 3).toString(),
        role: 'assistant',
        text: `❌ حدث خطأ: ${e?.message ?? 'unknown'}`,
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

  const renderLayerBadge = (msg: Message) => {
    if (!msg.layer) return null;
    const label = msg.layer === 'B' ? '🌐 LLM' : '🔒 Offline';
    const color = msg.layer === 'B' ? '#3498db' : '#95a5a6';
    return (
      <View style={[styles.badge, { borderColor: color }]}>
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>{llmStatus}</Text>
        {messages.length > 0 && (
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
        {messages.length === 0 && (
          <View style={styles.welcome}>
            <Text style={styles.welcomeTitle}>🤖 المساعد الذكي</Text>
            <Text style={styles.welcomeText}>
              اسأل عن الجذور، الكواكب، الأبراج، أو اطلب تحليلاً. جرّب: "حلل محمد".
            </Text>
            <Text style={styles.suggestTitle}>أمثلة:</Text>
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
            {msg.role === 'assistant' && renderLayerBadge(msg)}
            <Text
              style={[
                styles.bubbleText,
                msg.role === 'user' ? styles.userText : styles.aiText,
              ]}
            >
              {msg.text}
            </Text>

            {msg.warnings && msg.warnings.length > 0 && (
              <View style={styles.warningsBox}>
                {msg.warnings.map((w, i) => (
                  <Text key={i} style={styles.warningText}>⚠️ {w}</Text>
                ))}
              </View>
            )}

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
            <Text style={styles.loadingText}>جارٍ المعالجة...</Text>
          </View>
        )}
      </ScrollView>

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

  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    marginBottom: 6,
  },
  badgeText: { fontSize: 10, fontWeight: 'bold' },

  warningsBox: {
    marginTop: 8, paddingTop: 6,
    borderTopWidth: 1, borderTopColor: '#2c5070',
  },
  warningText: { color: '#f39c12', fontSize: 11, marginVertical: 2 },

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
