import { I18nManager } from 'react-native';
import { registerRootComponent } from 'expo';

import App from './App';

// ═══════════════════════════════════════════════════════════
// RTL Strategy — Hard-Coded
// ═══════════════════════════════════════════════════════════
// لا نستخدم forceRTL لأنه:
// 1) غير موثوق في Expo Go
// 2) يسبب انعكاساً مزدوجاً في APK
// بدلاً من ذلك، نفرض RTL يدوياً في كل مكون (row-reverse + textAlign: right).
I18nManager.allowRTL(false);

if (I18nManager.isRTL) {
  // إذا كانت الطبقة الأصلية RTL، نجبرها LTR حتى لا تعكس ستايلنا اليدوي
  I18nManager.forceRTL(false);
  console.log('🔧 forceRTL(false) — إعادة تشغيل مطلوبة');
}

console.log('🔍 RTL DEBUG: isRTL =', I18nManager.isRTL);

registerRootComponent(App);
