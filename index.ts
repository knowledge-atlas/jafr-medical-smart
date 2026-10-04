import { I18nManager } from 'react-native';
import { registerRootComponent } from 'expo';

import App from './App';

// ═══════════════════════════════════════════════════════════
// فرض RTL على التطبيق بالكامل
// ═══════════════════════════════════════════════════════════
I18nManager.allowRTL(true);
if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
  console.log('✅ RTL forced — أعد تشغيل التطبيق كاملاً');
}

registerRootComponent(App);
