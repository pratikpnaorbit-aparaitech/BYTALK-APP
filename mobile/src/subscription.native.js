let Purchases = null;
try {
  Purchases = require('react-native-purchases').default || require('react-native-purchases');
} catch (err) {
  console.warn('[BYTALK subscription.native] react-native-purchases native module not available:', err?.message || err);
}

const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

export async function configureSubscription(userId) {
  if (!Purchases || typeof Purchases.configure !== 'function') {
    return { available: false, reason: 'In-app purchases native module is not available on this build.' };
  }
  if (!apiKey) {
    return { available: false, reason: 'RevenueCat public API key is not configured.' };
  }
  try {
    await Purchases.configure({ apiKey, appUserID: String(userId) });
    return { available: true };
  } catch (error) {
    console.warn('[BYTALK subscription.native] configure error:', error?.message || error);
    return { available: false, reason: error?.message || 'Failed to initialize subscription engine.' };
  }
}

export async function purchasePlan(plan) {
  if (!Purchases || typeof Purchases.purchasePackage !== 'function') {
    throw new Error('In-app purchases are not supported on this device/build.');
  }
  try {
    const offerings = await Purchases.getOfferings();
    const packages = offerings?.current?.availablePackages || [];
    const match = packages.find((item) => item.identifier === plan.id || item.product?.identifier?.includes(plan.id));
    if (!match) throw new Error(`The ${plan.name} product is not configured in RevenueCat.`);
    return await Purchases.purchasePackage(match);
  } catch (error) {
    console.warn('[BYTALK subscription.native] purchasePlan error:', error?.message || error);
    throw error;
  }
}

export async function restorePurchases() {
  if (!Purchases || typeof Purchases.restorePurchases !== 'function') {
    return { customerInfo: null };
  }
  try {
    return await Purchases.restorePurchases();
  } catch (error) {
    console.warn('[BYTALK subscription.native] restorePurchases error:', error?.message || error);
    throw error;
  }
}
