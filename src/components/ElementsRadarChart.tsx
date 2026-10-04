import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Polygon, Circle, Line, Text as SvgText, G,
} from 'react-native-svg';

export interface ElementBalance {
  ناري: number;
  ترابي: number;
  هوائي: number;
  مائي: number;
}

interface Props {
  balance: ElementBalance;
  size?: number;
}

const ELEMENT_COLORS: Record<string, string> = {
  ناري: '#e74c3c',
  ترابي: '#8b7355',
  هوائي: '#3498db',
  مائي: '#1abc9c',
};

const ELEMENT_ICONS: Record<string, string> = {
  ناري: '🔥',
  ترابي: '🌍',
  هوائي: '💨',
  مائي: '💧',
};

export default function ElementsRadarChart({ balance, size = 280 }: Props) {
  const center = size / 2;
  const maxRadius = size * 0.36;

  // 4 محاور في 90 درجة
  const axes = ['ناري', 'ترابي', 'هوائي', 'مائي'];
  const total = Object.values(balance).reduce((s, v) => s + v, 0);
  const normalized = total > 0
    ? {
        ناري: balance.ناري / total,
        ترابي: balance.ترابي / total,
        هوائي: balance.هوائي / total,
        مائي: balance.مائي / total,
      }
    : { ناري: 0.25, ترابي: 0.25, هوائي: 0.25, مائي: 0.25 };

  // حساب نقاط كل عنصر (زاوية = 90° بين كل محور)
  const getPoint = (index: number, ratio: number): [number, number] => {
    const angle = (Math.PI * 2 * index) / 4 - Math.PI / 2;
    const r = maxRadius * ratio;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };

  // نقاط الفئة الفعلية
  const dataPoints: [number, number][] = axes.map((el, i) =>
    getPoint(i, normalized[el as keyof typeof normalized])
  );
  const dataPolygon = dataPoints.map((p) => `${p[0]},${p[1]}`).join(' ');

  // 4 شبكات متداخلة (25%, 50%, 75%, 100%)
  const gridPolygons = [0.25, 0.5, 0.75, 1].map((ratio) => {
    const points = axes.map((_, i) => getPoint(i, ratio));
    return points.map((p) => `${p[0]},${p[1]}`).join(' ');
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚖️ توازن الطبائع الأربع</Text>

      <View style={[styles.chartWrapper, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          {/* شبكات متداخلة */}
          <G>
            {gridPolygons.map((poly, i) => (
              <Polygon
                key={`grid-${i}`}
                points={poly}
                fill="none"
                stroke="#2c5070"
                strokeWidth={1}
                opacity={0.5}
              />
            ))}
          </G>

          {/* المحاور الأربعة */}
          <G>
            {axes.map((_, i) => {
              const [x, y] = getPoint(i, 1);
              return (
                <Line
                  key={`axis-${i}`}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="#2c5070"
                  strokeWidth={1}
                />
              );
            })}
          </G>

          {/* الفئة الفعلية */}
          <Polygon
            points={dataPolygon}
            fill="#d4af37"
            fillOpacity={0.35}
            stroke="#d4af37"
            strokeWidth={2}
          />

          {/* نقاط البيانات */}
          <G>
            {dataPoints.map((p, i) => (
              <Circle
                key={`point-${i}`}
                cx={p[0]}
                cy={p[1]}
                r={5}
                fill={ELEMENT_COLORS[axes[i]]}
                stroke="#fff"
                strokeWidth={1.5}
              />
            ))}
          </G>

          {/* المركز */}
          <Circle cx={center} cy={center} r={3} fill="#d4af37" />

          {/* الملصقات الأربعة */}
          <G>
            {axes.map((el, i) => {
              const [x, y] = getPoint(i, 1.18);
              return (
                <SvgText
                  key={`label-${i}`}
                  x={x}
                  y={y}
                  fill={ELEMENT_COLORS[el]}
                  fontSize={13}
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {el}
                </SvgText>
              );
            })}
          </G>
        </Svg>
      </View>

      {/* بطاقات النسب */}
      <View style={styles.legendRow}>
        {axes.map((el) => {
          const pct = (normalized[el as keyof typeof normalized] * 100).toFixed(0);
          return (
            <View
              key={el}
              style={[styles.legendCard, { borderLeftColor: ELEMENT_COLORS[el] }]}
            >
              <Text style={styles.legendIcon}>{ELEMENT_ICONS[el]}</Text>
              <Text style={styles.legendElement}>{el}</Text>
              <Text style={[styles.legendPct, { color: ELEMENT_COLORS[el] }]}>
                {pct}%
              </Text>
            </View>
          );
        })}
      </View>

      {/* الطبع الغالب والمفقود */}
      <View style={styles.insightBox}>
        <Text style={styles.insightText}>
          💡 <Text style={styles.bold}>الطبع الغالب:</Text>{' '}
          {getDominant(balance)}
          {'  ·  '}
          <Text style={styles.bold}>الطبع المفقود:</Text>{' '}
          {getMissing(balance)}
        </Text>
      </View>
    </View>
  );
}

function getDominant(balance: ElementBalance): string {
  return Object.entries(balance).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
}

function getMissing(balance: ElementBalance): string {
  const opposite: Record<string, string> = {
    ناري: 'مائي',
    مائي: 'ناري',
    ترابي: 'هوائي',
    هوائي: 'ترابي',
  };
  const dom = getDominant(balance);
  return opposite[dom] ?? '—';
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a3b5d',
    borderRadius: 14,
    padding: 14,
    marginVertical: 10,
  },
  title: {
    color: '#d4af37',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  chartWrapper: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 6,
  },
  legendCard: {
    flex: 1,
    backgroundColor: '#0a1628',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    alignItems: 'center',
  },
  legendIcon: { fontSize: 18, marginBottom: 2 },
  legendElement: { color: '#e8e8e8', fontSize: 11, marginBottom: 2 },
  legendPct: { fontSize: 14, fontWeight: 'bold' },
  insightBox: {
    backgroundColor: '#0a1628',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  insightText: {
    color: '#e8e8e8',
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'right',
  },
  bold: { color: '#d4af37', fontWeight: 'bold' },
});
