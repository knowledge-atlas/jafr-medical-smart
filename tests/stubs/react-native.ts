export const Platform = { OS: 'android', Version: 34, select: (o: any) => o.android ?? o.default ?? o.ios };
export const NativeModules = {};
export const StyleSheet = { create: (s: any) => s };
export const Dimensions = { get: () => ({ width: 400, height: 800 }) };
export const PixelRatio = { get: () => 2, getFontScale: () => 1 };
export const Appearance = { getColorScheme: () => 'light' };
export const Linking = { openURL: async () => {} };
export default {};
