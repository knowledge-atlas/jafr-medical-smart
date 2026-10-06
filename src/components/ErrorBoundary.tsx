import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { errorLogger } from '../utils/errorLogger';

interface Props {
  children: React.ReactNode;
  onError?: (err: Error) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    errorLogger.log(error, {
      componentStack: info?.componentStack ?? undefined,
      meta: { source: 'ErrorBoundary' },
    });
    this.setState({ componentStack: info?.componentStack ?? null });
    this.props.onError?.(error);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, componentStack: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>حدث خطأ غير متوقع</Text>
        <Text style={styles.subtitle}>
          تم تسجيل المشكلة في سجل الأخطاء. يمكنك المتابعة.
        </Text>

        <ScrollView style={styles.errorBox} contentContainerStyle={{ padding: 10 }}>
          <Text style={styles.errorMsg}>{this.state.error?.message ?? 'Unknown error'}</Text>
          {this.state.componentStack ? (
            <Text style={styles.errorStack} numberOfLines={6}>
              {this.state.componentStack.slice(0, 400)}
            </Text>
          ) : null}
        </ScrollView>

        <TouchableOpacity style={styles.btn} onPress={this.handleReload}>
          <Text style={styles.btnText}>🔄 إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', padding: 20, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 60, marginBottom: 20 },
  title: { color: '#e74c3c', fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: '#a0a0a0', fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  errorBox: { maxHeight: 200, width: '100%', backgroundColor: '#0f2438', borderRadius: 8, borderWidth: 1, borderColor: '#2c5070', marginBottom: 20 },
  errorMsg: { color: '#e74c3c', fontSize: 12, fontFamily: 'monospace', textAlign: 'left', marginBottom: 8 },
  errorStack: { color: '#888', fontSize: 10, fontFamily: 'monospace', textAlign: 'left' },
  btn: { backgroundColor: '#3498db', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 10 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});
