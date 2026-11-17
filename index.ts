import { I18nManager } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';

// الواجهات مبنية على اتجاه RTL يدوي (textAlign/row-reverse)،
// لذا نثبّت اتجاه النظام على LTR حتى لا ينعكس التخطيط مرتين على هواتف اللغة العربية.
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

registerRootComponent(App);
