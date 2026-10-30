import { I18nManager } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';

// ═══════════════════════════════════════════════════════════
// RTL — إجباري على مستوى Android native
// ═══════════════════════════════════════════════════════════
I18nManager.allowRTL(true);

console.log('🔍 RTL DEBUG: isRTL =', I18nManager.isRTL);

registerRootComponent(App);
