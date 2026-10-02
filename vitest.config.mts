import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

const stub = (p: string) => resolve(process.cwd(), 'tests/stubs', p);

export default defineConfig({
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
  resolve: {
    alias: {
      'react-native': stub('react-native.ts'),
      '@react-native-async-storage/async-storage': stub('async-storage.ts'),
      'expo-asset': stub('expo-asset.ts'),
      'expo-file-system': stub('expo-file-system.ts'),
      'expo-secure-store': stub('expo-secure-store.ts'),
    },
  },
});
