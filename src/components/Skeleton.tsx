import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';

/** هيكل تحميل نابض خفيف (Native Driver) */
export const Skeleton = React.memo(function Skeleton({ height = 16, width = '100%', radius = 8, style }: { height?: number; width?: number | string; radius?: number; style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ height, width: width as any, borderRadius: radius, backgroundColor: '#1a3b5d', opacity }, style]} />;
});

export const SkeletonList = React.memo(function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.card}>
          <Skeleton height={18} width="60%" />
          <Skeleton height={12} style={{ marginTop: 10 }} />
          <Skeleton height={12} width="80%" style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { padding: 16 },
  card: { backgroundColor: '#0f2438', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1a3b5d' },
});
