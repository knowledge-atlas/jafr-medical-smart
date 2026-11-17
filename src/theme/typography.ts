/**
 * خط عربي موحد (Cairo) لكل النصوص.
 * يُطبَّق مرة واحدة عند الإقلاع عبر applyGlobalFont()، ويختار الوزن المناسب
 * من fontWeight لأن أندرويد يحتاج عائلة خط مستقلة لكل وزن.
 * إن لم تدعم نسخة React Native هذا الأسلوب يبقى خط النظام دون أي كسر.
 */
import React from 'react';
import { Text, TextInput, StyleSheet } from 'react-native';
import {
  Cairo_400Regular,
  Cairo_600SemiBold,
  Cairo_700Bold,
} from '@expo-google-fonts/cairo';

export const CAIRO_FONTS = { Cairo_400Regular, Cairo_600SemiBold, Cairo_700Bold };

function familyFor(weight: unknown): string {
  const w = String(weight ?? '400');
  if (w === 'bold' || w === '700' || w === '800' || w === '900') return 'Cairo_700Bold';
  if (w === '600') return 'Cairo_600SemiBold';
  return 'Cairo_400Regular';
}

function patch(Component: any) {
  if (!Component || Component.__jafrFontPatched || typeof Component.render !== 'function') return;
  const original = Component.render;
  Component.render = function (...args: any[]) {
    const element = original.apply(this, args);
    try {
      const flat: any = StyleSheet.flatten(element?.props?.style) || {};
      if (flat.fontFamily) return element; // احترم أي خط محدد صراحةً
      return React.cloneElement(element, { style: [{ fontFamily: familyFor(flat.fontWeight) }, element.props.style] });
    } catch {
      return element;
    }
  };
  Component.__jafrFontPatched = true;
}

export function applyGlobalFont() {
  patch(Text as any);
  patch(TextInput as any);
}
