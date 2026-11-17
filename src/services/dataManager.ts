/**
 * dataManager — حذف بيانات المستخدم فعلياً من الجهاز (متطلب Google Play).
 * يحذف: AsyncStorage بالكامل (التقارير، السجل، الموافقة، الإحصائيات، سجل الأخطاء،
 * المعرفة المستوردة) + مفاتيح الذكاء الاصطناعي من SecureStore.
 * لا يحذف حالة العضوية (isPremium) كي لا يفقد المشترك استحقاقه بحذف بياناته.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteAIKeys } from './AIIntegration';

export async function clearAllUserData(): Promise<void> {
  await AsyncStorage.clear();
  await deleteAIKeys();
}
