/**
 * BillingService — نقطة الربط مع Google Play Billing.
 *
 * المحتوى الرقمي في Google Play يجب أن يُباع عبر Google Play Billing فقط.
 * لم تُضَف مكتبة فوترة بعد (react-native-iap / expo-iap) ولا منتجات في Play Console،
 * لذلك يعمل المحوّل الافتراضي بوضع "غير متاح". عند الجاهزية استدعِ setBillingAdapter().
 */
export const PRODUCT_IDS = {
  monthly: 'jafr_premium_monthly',
  yearly: 'jafr_premium_yearly',
} as const;

export type PlanId = keyof typeof PRODUCT_IDS;

export type PurchaseResult =
  | { status: 'purchased' }
  | { status: 'cancelled' }
  | { status: 'unavailable' }
  | { status: 'error'; message: string };

export interface BillingAdapter {
  purchase(productId: string): Promise<PurchaseResult>;
}

let adapter: BillingAdapter | null = null;

export function setBillingAdapter(a: BillingAdapter | null) {
  adapter = a;
}

export async function purchasePlan(plan: PlanId): Promise<PurchaseResult> {
  if (!adapter) return { status: 'unavailable' };
  try {
    return await adapter.purchase(PRODUCT_IDS[plan]);
  } catch (e: any) {
    return { status: 'error', message: e?.message ?? 'فشل الدفع' };
  }
}
