import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { queryRouter, responseFormatter, llmBridge, HybridEngine } from '../ai';
import { AIResponse } from '../ai/types';
import { createRealAnalyzeNameUseCase } from '../application/di';
import { routeAssistantText } from './assistantRouter';
import { defaultLLMCaller } from '../ai/defaultLLMCaller';
import { ScientificReportEngine } from '../ai/ScientificReportEngine';
import { DeepDiveReport } from '../products/DeepDiveReport';
import { analyzeName } from '../application/di';

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
  'السلام عليكم',
  'حلل شخصية محمد',
  'اشرح لي الفرق بين الجذر والكوكب',
  'كيف أطبق توصيات تقريري؟',
  'ما هي أفضل أيام الذروة القادمة؟',
];

const scientificEngine = new ScientificReportEngine();
const deepDive = new DeepDiveReport();

const hybridEngine = new HybridEngine({
  analyzer: createRealAnalyzeNameUseCase(),
  llmCaller: defaultLLMCaller,
});

export default function AssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [llmStatus, setLlmStatus] = useState<string>('');
  const [hasLLM, setHasLLM] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    checkLlmStatus();
  }, []);

  const checkLlmStatus = async () => {
    const provider = await llmBridge.getProvider();
    const enabled = provider === 'gemini' || provider === 'openai';
    setHasLLM(enabled);
    if (provider === 'none') {
      setLlmStatus('🔒 وضع محلي (بدون إنترنت)');
    } else if (provider === 'demo') {
      setLlmStatus('🤖 وضع تجريبي');
    } else {
      setLlmStatus(`🌐 ${provider === 'gemini' ? 'Gemini' : 'OpenAI/Groq'} مفعّل`);
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
      const route = routeAssistantText(text.trim(), hasLLM);

      // ─── حالة 1: يوجد اسم → التقرير التأملي العلمي ───
      if (route.name) {
        const analysis = analyzeName.execute({ name: route.name });

        if (analysis.status === 'abstained') {
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: analysis.report,
            layer: 'A',
            offline: true,
            warnings: analysis.abstention.messages,
            timestamp: new Date().toISOString(),
          };
          setMessages(prev => [...prev, aiMsg]);
        } else {
          const deepDiveOutput = deepDive.generate(analysis, route.mode ?? 'personal', {
            richMarkdown: analysis.report,
          });
          const scientific = await scientificEngine.buildFromDeepDive(deepDiveOutput);

          const aiMsg: Message = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            text: scientific.markdown,
            layer: scientific.offline ? 'A' : 'B',
            offline: scientific.offline,
            timestamp: new Date().toISOString(),
          };
          setMessages(prev => [...prev, aiMsg]);
        }
      }
      // ─── حالة 2: لا اسم → محادثة عامة ───
      else if (hasLLM) {
        const result = await hybridEngine.process({
          question: text.trim(),
          mode: route.mode,
        });

        const aiMsg: Message = {
          id: (Date.now() + 3).toString(),
          role: 'assistant',
          text: result.answer,
          layer: result.layer,
          offline: result.offline,
          warnings: result.warnings,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMsg]);
      }
      // ─── حالة 3: KB محلي فقط ───
      else {
        const response = await queryRouter.route(text.trim());
        const formatted = responseFormatter.format(response);
        const aiMsg: Message = {
          id: (Date.now() + 4).toString(),
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
              اسأل بحرية — عن الجفر، التحليل، التوصيات، أو أي شيء يدور في ذهنك.
              {hasLLM ? ' الذكاء الاصطناعي مفعّل ويرد مباشرة.' : ' فعّل Gemini أو Groq من الإعدادات لردود ذكية.'}
            </Text>
            <Text style={styles.suggestTitle}>جرّب:</Text>
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
  welcomeText: { color: '#c0c0c0', fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  suggestTitle: { color: '#d4af37', fontSize: 14, marginBottom: 10 },
  suggestionChip: {
    backgroundColor: '#1a3b5d', borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 14, marginVertical: 4,
    alignSelf: 'stretch',
  },
  suggestionText: { color: '#d4af37', fontSize: 13 },
  bubble: { maxWidth: '92%', marginVertical: 6, padding: 12, borderRadius: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#1abc9c' },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#1a3b5d' },
  bubbleText: { fontSize: 14, lineHeight: 24 },
  userText: { color: '#fff' },
  aiText: { color: '#e8e8e8' },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2, marginBottom: 6,
  },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  warningsBox: {
    marginTop: 8, paddingTop: 6,
    borderTopWidth: 1, borderTopColor: '#2c5070',
  },
  warningText: { color: '#f39c12', fontSize: 11, marginVertical: 2 },
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
