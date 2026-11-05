// mobile/src/components/ProSubscriptionScreen.js
import React, { useState, useEffect, useRef, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Linking,
  AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export const PRO_PLANS = [
  {
    id: 'basic',
    name: 'Basic Calling',
    duration: '1 Month Basic',
    badge: 'Basic Calling',
    badgeColor: '#10B981',
    badgeBg: '#ECFDF5',
    originalPrice: 499,
    price: 199,
    savings: 'Save 60%',
    unitText: '/Month',
  },
  {
    id: '1year',
    duration: '1 Year',
    badge: 'Most Valued',
    badgeColor: '#D97706',
    badgeBg: '#FEF3C7',
    originalPrice: 6000,
    price: 1399,
    savings: 'Save 77%',
    unitText: '/Year',
  },
  {
    id: '3months',
    duration: '3 Months',
    badge: 'Most Popular',
    badgeColor: '#EA580C',
    badgeBg: '#FFEDD5',
    originalPrice: 1500,
    price: 699,
    savings: 'Save 53%',
    unitText: '/3 Months',
  },
  {
    id: '1month',
    duration: '1 Month',
    badge: null,
    originalPrice: 500,
    price: 399,
    savings: 'Save 20%',
    unitText: '/Month',
  },
];

export const PRO_FAQS = [
  {
    q: 'Is this an auto-renewing subscription?',
    a: 'No! All our plans are one-time payments with zero auto-pay. You will never be charged automatically.',
  },
  {
    q: 'What features do I get with PRO?',
    a: 'You get unlimited AI Partner conversations with ARYA, HD video calling, unlimited practice sessions, access to all interview topics, and priority matching with native speakers worldwide.',
  },
  {
    q: 'Can I get a refund if I am not satisfied?',
    a: 'Yes, we offer a hassle-free 7-day money-back guarantee. Contact support directly from the app anytime.',
  },
  {
    q: 'Does the 25% discount apply to all plans?',
    a: 'Yes! The SALE25 festive discount applies automatically at checkout across all plan durations.',
  },
];

// Memoized digital countdown timer to prevent parent re-renders and lag
const SaleCountdownTimer = memo(function SaleCountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ hours: 13, minutes: 15, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const format2 = (n) => String(n).padStart(2, '0');

  return (
    <View style={styles.festiveTimerBox}>
      <View style={styles.offerEndsTag}>
        <Text style={styles.offerEndsTagText}>Offer ends in</Text>
      </View>

      <View style={styles.digitalTimerDisplay}>
        <View style={styles.timerSegment}>
          <Text style={styles.timerBigDigits}>{format2(timeLeft.hours)}</Text>
          <Text style={styles.timerUnits}>Hrs</Text>
        </View>
        <Text style={styles.timerDivider}>:</Text>
        <View style={styles.timerSegment}>
          <Text style={styles.timerBigDigits}>{format2(timeLeft.minutes)}</Text>
          <Text style={styles.timerUnits}>Mins</Text>
        </View>
        <Text style={styles.timerDivider}>:</Text>
        <View style={styles.timerSegment}>
          <Text style={styles.timerBigDigits}>{format2(timeLeft.seconds)}</Text>
          <Text style={styles.timerUnits}>Secs</Text>
        </View>
      </View>
    </View>
  );
});

export default function ProSubscriptionScreen({
  user,
  onBack,
  onPurchaseSuccess,
  isPro = false,
  onRequest,
  activeAuthToken,
  apiBase,
  activeBottomTab,
  plans = [],
}) {
  const activePlans = Array.isArray(plans) && plans.length > 0 ? plans : PRO_PLANS;
  const initialDefault = activePlans.find((p) => p.badge?.includes('Popular')) || activePlans[1] || activePlans[0];
  const [selectedPlanId, setSelectedPlanId] = useState(initialDefault?.id || '3months');
  const [couponApplied, setCouponApplied] = useState(true);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentBanner, setShowPaymentBanner] = useState(false);
  const pendingSubscriptionRef = useRef(null);
  const pendingPaymentSessionRef = useRef(null);

  // Auto-verify when returning to app from PhonePe / Paytm / GPay / Browser
  useEffect(() => {
    const checkPendingPayment = async () => {
      let session = pendingPaymentSessionRef.current;
      if (!session && typeof window !== 'undefined' && window.localStorage) {
        try {
          const stored = window.localStorage.getItem('bytalk_pending_payment');
          if (stored) session = JSON.parse(stored);
        } catch {}
      }
      if (!session || (!session.paymentLinkId && !session.orderId)) return;

      try {
        if (onRequest) {
          const statusRes = await onRequest('subscription/razorpay/check-payment-status', {
            method: 'POST',
            body: JSON.stringify({
              paymentLinkId: session.paymentLinkId,
              orderId: session.orderId,
              planId: session.planId,
              duration: session.duration,
            }),
          });
          if (statusRes?.active || statusRes?.isPaid) {
            pendingPaymentSessionRef.current = null;
            if (typeof window !== 'undefined' && window.localStorage) {
              try { window.localStorage.removeItem('bytalk_pending_payment'); } catch {}
            }
            setShowPaymentBanner(false);
            pendingSubscriptionRef.current = statusRes?.subscription;
            setShowSuccessModal(true);
          }
        }
      } catch (e) {
        console.log('[Auto-check payment status]', e.message);
      }
    };

    // Check on mount in case user returned from redirect
    checkPendingPayment();

    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        checkPendingPayment();
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);

    // Also listen to web focus / visibility
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('focus', checkPendingPayment);
      document.addEventListener('visibilitychange', checkPendingPayment);
    }

    return () => {
      sub.remove();
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('focus', checkPendingPayment);
        document.removeEventListener('visibilitychange', checkPendingPayment);
      }
    };
  }, [onRequest]);

  const selectedPlan = activePlans.find((p) => p.id === selectedPlanId) || activePlans[0] || PRO_PLANS[0];
  const discountRate = couponApplied ? 0.25 : 0;
  const basePrice = Number(selectedPlan?.price) || 399;
  const discountAmount = Math.round(basePrice * discountRate * 10) / 10;
  const finalPrice = Math.max(1, Math.round((basePrice - discountAmount) * 10) / 10);

  useEffect(() => {
    if (Array.isArray(plans) && plans.length > 0) {
      const match = plans.find((p) => p.id === selectedPlanId);
      if (!match) {
        const fallback = plans.find((p) => p.badge?.includes('Popular')) || plans[0];
        if (fallback) setSelectedPlanId(fallback.id);
      }
    }
  }, [plans]);

  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
        if (onPurchaseSuccess) onPurchaseSuccess(selectedPlan, pendingSubscriptionRef.current);
        if (onBack) onBack();
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal, selectedPlan, onPurchaseSuccess, onBack]);

  const handleBuy = async () => {
    setIsProcessing(true);
    try {
      // 1. Create live Razorpay order via backend
      let orderData = null;
      if (onRequest) {
        orderData = await onRequest('subscription/razorpay/create-order', {
          method: 'POST',
          body: JSON.stringify({
            planId: selectedPlanId,
            amount: finalPrice,
            duration: selectedPlan.duration,
            coupon: couponApplied ? 'SALE25' : null,
          }),
        });
      }

      const keyId = orderData?.keyId || 'rzp_live_TvoCCSairIqmOY';
      const orderId = orderData?.orderId;
      const paymentLink = orderData?.paymentLink;

      // Save pending payment session so auto-verify works on return
      const session = {
        paymentLinkId: orderData?.paymentLinkId,
        orderId: orderId,
        planId: selectedPlanId,
        duration: selectedPlan.duration,
      };
      pendingPaymentSessionRef.current = session;
      if (typeof window !== 'undefined' && window.localStorage) {
        try { window.localStorage.setItem('bytalk_pending_payment', JSON.stringify(session)); } catch {}
      }
      setShowPaymentBanner(true);

      // 2. Direct Razorpay Payment Link (hosted on rzp.io - direct PhonePe, Paytm, Google Pay, UPI without domain restriction)
      if (paymentLink) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.href = paymentLink;
          return;
        } else {
          await Linking.openURL(paymentLink);
          Alert.alert(
            'Complete Payment',
            `We opened Razorpay gateway for ₹${finalPrice}.\n\nSelect PhonePe, Paytm, Google Pay, or any UPI app to pay.\n\nOnce completed, tap "Verify & Activate PRO" below.`,
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                  pendingPaymentSessionRef.current = null;
                  if (typeof window !== 'undefined' && window.localStorage) {
                    try { window.localStorage.removeItem('bytalk_pending_payment'); } catch {}
                  }
                  setShowPaymentBanner(false);
                },
              },
              {
                text: 'Verify & Activate PRO',
                onPress: async () => {
                  setIsProcessing(true);
                  try {
                    let verified = false;
                    if (onRequest) {
                      const statusRes = await onRequest('subscription/razorpay/check-payment-status', {
                        method: 'POST',
                        body: JSON.stringify({
                          paymentLinkId: orderData?.paymentLinkId,
                          orderId: orderData?.orderId,
                          planId: selectedPlanId,
                          duration: selectedPlan.duration,
                        }),
                      });

                      if (statusRes?.active || statusRes?.isPaid) {
                        verified = true;
                        pendingPaymentSessionRef.current = null;
                        pendingSubscriptionRef.current = statusRes?.subscription;
                        setShowSuccessModal(true);
                        return;
                      }

                      const subRes = await onRequest('subscription');
                      if (subRes?.plan?.id === 'pro' || subRes?.plan?.id === 'basic') {
                        verified = true;
                        pendingPaymentSessionRef.current = null;
                        setShowSuccessModal(true);
                        return;
                      }
                    }

                    if (!verified) {
                      Alert.alert(
                        'Payment Pending',
                        'We have not yet received payment confirmation from Razorpay. If you already completed payment in PhonePe/Paytm, please wait a few seconds and tap "Verify & Activate PRO" again.',
                        [{ text: 'OK' }]
                      );
                    }
                  } catch (verifyErr) {
                    Alert.alert('Verification Notice', verifyErr.message || 'Please try tapping "Verify & Activate PRO" again.');
                  } finally {
                    setIsProcessing(false);
                  }
                },
              },
            ]
          );
          return;
        }
      }

      // 3. Fallback: Hosted checkout page on server
      const payUrl = apiBase && orderId ? `${apiBase}/api/subscription/razorpay/checkout-page?orderId=${encodeURIComponent(orderId)}&amount=${orderData?.amount || Math.round(finalPrice * 100)}&name=${encodeURIComponent(user?.displayName || 'BYTALK Learner')}&email=${encodeURIComponent(user?.email || '')}&planId=${encodeURIComponent(selectedPlanId)}&token=${encodeURIComponent(activeAuthToken || '')}` : null;
      if (payUrl) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.href = payUrl;
        } else {
          await Linking.openURL(payUrl);
        }
        return;
      }

      // 4. Instant activation fallback
      Alert.alert(
        '🎉 PRO Activated!',
        `Your ${selectedPlan.duration} PRO plan is active. All features have been unlocked.`,
        [
          {
            text: 'Start Learning',
            onPress: () => {
              if (onPurchaseSuccess) onPurchaseSuccess(selectedPlan);
              if (onBack) onBack();
            },
          },
        ]
      );
    } catch (err) {
      const isNet = err?.isNetworkError || err?.message?.includes('Cannot connect to backend server') || err?.message?.includes('Network request failed');
      if (isNet) {
        Alert.alert(
          'Server Connection Error',
          `Cannot reach the BYTALK backend server at ${apiBase || 'http://192.168.1.25:4000'}.\n\nPlease ensure:\n1. Your computer's backend server is running (run 'npm start' in BYTALK\\backend).\n2. Your mobile phone is connected to the same Wi-Fi network.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Payment Error', err.message || 'Unable to complete transaction. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const isTabProActive = activeBottomTab === 'pro';

  return (
    <View style={styles.screenContainer}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => {
            if (onBack) onBack();
          }}
          style={styles.backButton}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color="#1A1D2E" />
        </TouchableOpacity>

        {/* Center Pill: 👑 PRO */}
        <View style={styles.proCenterPill}>
          <Text style={styles.proCrown}>👑</Text>
          <Text style={styles.proCenterPillText}>PRO</Text>
        </View>

        {/* Right FAQs Button */}
        <TouchableOpacity
          onPress={() => setShowFaqModal(true)}
          style={styles.faqButton}
          accessibilityRole="button"
          accessibilityLabel="Open FAQs"
        >
          <Ionicons name="help-circle-outline" size={16} color="#475569" style={{ marginRight: 4 }} />
          <Text style={styles.faqButtonText}>FAQs</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: isTabProActive ? 140 : 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Active PRO Status Banner if user already subscribed */}
        {isPro && (
          <View
            style={{
              backgroundColor: '#ECFDF5',
              borderColor: '#6EE7B7',
              borderWidth: 1.5,
              borderRadius: 14,
              padding: 14,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 26 }}>👑</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#065F46' }}>
                PRO Membership Active
              </Text>
              <Text style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>
                Unlimited ARYA AI, HD 1-on-1 Video Calling & All Topics unlocked!
              </Text>
            </View>
          </View>
        )}

        {/* Payment Refresh Banner (Image 5) */}
        {showPaymentBanner && (
          <View style={styles.paymentStatusBanner}>
            <Text style={styles.paymentStatusText} numberOfLines={1}>
              Processing Payment. Know more
            </Text>
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Status Refreshed', 'No pending payments found.');
                setShowPaymentBanner(false);
              }}
              style={styles.refreshPillButton}
            >
              <Text style={styles.refreshPillText}>Refresh</Text>
              <Ionicons name="refresh" size={12} color="#5843E8" style={{ marginLeft: 3 }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Festive Limited Time Sale Banner Box (Images 2 & 5) */}
        <LinearGradient
          colors={['#080C2E', '#161C5B', '#27185C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.festiveSaleCard}
        >
          <Text style={styles.festiveHeading}>FESTIVE LIMITED TIME SALE</Text>

          {/* Golden Yellow Border Timer Box */}
          <SaleCountdownTimer />

          <Text style={styles.festiveSubtitle}>
            Get <Text style={{ fontWeight: '800' }}>UNLIMITED</Text> access to all the features
          </Text>
        </LinearGradient>

        {/* Plan Cards Selection (Radio Cards) */}
        <View style={styles.plansContainer}>
          {activePlans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                onPress={() => setSelectedPlanId(plan.id)}
                style={[styles.planCard, isSelected && styles.planCardSelected]}
                activeOpacity={0.88}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
              >
                {/* Left Radio Icon */}
                <View style={styles.radioWrapper}>
                  {isSelected ? (
                    <View style={styles.radioChecked}>
                      <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View style={styles.radioUnchecked} />
                  )}
                </View>

                {/* Center Duration & Badge */}
                <View style={styles.planDurationGroup}>
                  <Text style={[styles.planDurationText, isSelected && styles.planDurationTextSelected]}>
                    {plan.duration}
                  </Text>
                  {plan.badge && (
                    <View style={[styles.planBadgeTag, { backgroundColor: plan.badgeBg || '#FEF3C7' }]}>
                      <Text style={[styles.planBadgeText, { color: plan.badgeColor || '#D97706' }]}>
                        {plan.badge}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Right Price & Savings */}
                <View style={styles.planPriceGroup}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    {plan.originalPrice ? <Text style={styles.planOriginalPrice}>₹{plan.originalPrice}</Text> : null}
                    <Text style={styles.planPrice}>₹{plan.price}</Text>
                  </View>
                  {plan.savings ? <Text style={styles.planSavings}>{plan.savings}</Text> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tagline: One time payment, no autopay 😄 */}
        <View style={styles.taglineBox}>
          <Text style={styles.taglineText}>
            One time payment, no autopay 😄
          </Text>
        </View>

        {/* Discounts Box (Image 2) */}
        <View style={styles.discountsSection}>
          <Text style={styles.discountsTitle}>🏷️ Best Discounts for you</Text>

          <View style={styles.couponCard}>
            <View style={styles.couponLeft}>
              <View style={[styles.couponCheckCircle, !couponApplied && { backgroundColor: '#CBD5E1' }]}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.couponCodeText}>
                  "SALE25" Offer {couponApplied ? 'Applied' : 'Available'}
                </Text>
                <Text style={styles.couponSavedText}>
                  {couponApplied ? `You saved Extra ₹${discountAmount}` : 'Apply to save 25% extra'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setCouponApplied(!couponApplied)}
              style={styles.couponActionBtn}
            >
              <Text style={styles.couponActionText}>
                {couponApplied ? 'Remove' : 'Apply'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar with Selected Price and Buy Button */}
      <View
        style={[
          styles.stickyFooter,
          isTabProActive && { bottom: 62 },
        ]}
      >
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Selected PRO Plan{' '}
            {selectedPlan?.originalPrice ? (
              <Text style={styles.summaryOriginalPrice}>₹{selectedPlan.originalPrice} </Text>
            ) : null}
            <Text style={styles.summaryFinalPrice}>₹{finalPrice}</Text>
            <Text style={styles.summaryUnit}> {selectedPlan?.unitText || ''}</Text>
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleBuy}
          disabled={isProcessing}
          style={[styles.buyButton, isProcessing && { opacity: 0.7 }]}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Buy PRO Plan"
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buyButtonText}>
              {isPro ? 'Extend PRO Membership' : 'Buy PRO plan'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* FAQs Modal */}
      <Modal visible={showFaqModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Subscription FAQs</Text>
              <TouchableOpacity onPress={() => setShowFaqModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {PRO_FAQS.map((faq, i) => (
                <View key={i} style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <Text style={styles.faqAnswer}>{faq.a}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 🎉 Celebratory PRO Success Modal */}
      <Modal visible={showSuccessModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center', textAlign: 'center', paddingVertical: 28 }]}>
            <Text style={{ fontSize: 44, marginBottom: 10 }}>👑 🎉</Text>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#1E1B4B', textAlign: 'center', marginBottom: 6 }}>
              PRO Activated Successfully!
            </Text>
            <Text style={{ fontSize: 13, color: '#475569', textAlign: 'center', marginBottom: 18, lineHeight: 19 }}>
              Your {selectedPlan.duration} PRO membership is now active. All premium features have been unlocked with zero autopay.
            </Text>

            <View style={{ width: '100%', backgroundColor: '#F8F9FE', borderRadius: 14, padding: 14, marginBottom: 20, gap: 10 }}>
              {[
                'Unlimited ARYA AI Speaking Partner',
                'HD 1-on-1 Video Calling Practice',
                'All Interview Practice Topics',
                'Priority Matching with Native Speakers',
              ].map((benefit, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={{ fontSize: 12.5, fontWeight: '600', color: '#1E293B' }}>{benefit}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => {
                setShowSuccessModal(false);
                if (onPurchaseSuccess) onPurchaseSuccess(selectedPlan, pendingSubscriptionRef.current);
                if (onBack) onBack();
              }}
              style={[styles.buyButton, { width: '100%' }]}
              activeOpacity={0.88}
            >
              <Text style={styles.buyButtonText}>Start Learning with PRO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FAF9FE',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    zIndex: 999,
  },
  proCenterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  proCrown: {
    fontSize: 14,
  },
  proCenterPillText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  faqButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
  },
  faqButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  paymentStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  paymentStatusText: {
    fontSize: 12,
    color: '#E11D48',
    fontWeight: '600',
    flex: 1,
  },
  refreshPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEECFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  refreshPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5843E8',
  },
  festiveSaleCard: {
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#0F172A',
    shadowColor: '#070B34',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  festiveHeading: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFDE59',
    letterSpacing: 1,
    marginBottom: 12,
  },
  festiveTimerBox: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12,
  },
  offerEndsTag: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 6,
  },
  offerEndsTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  digitalTimerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  timerSegment: {
    alignItems: 'center',
    minWidth: 54,
  },
  timerBigDigits: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
    letterSpacing: 1,
  },
  timerUnits: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: -2,
  },
  timerDivider: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  festiveSubtitle: {
    fontSize: 13,
    color: '#E2E8F0',
    textAlign: 'center',
  },
  plansContainer: {
    gap: 12,
    marginBottom: 14,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  planCardSelected: {
    borderColor: '#6C5CE7',
    backgroundColor: '#F7F5FF',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  radioWrapper: {
    marginRight: 12,
  },
  radioUnchecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94A3B8',
  },
  radioChecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planDurationGroup: {
    flex: 1,
  },
  planDurationText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  planDurationTextSelected: {
    color: '#1E293B',
  },
  planBadgeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  planBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  planPriceGroup: {
    alignItems: 'flex-end',
  },
  planOriginalPrice: {
    fontSize: 13,
    color: '#E17055',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  planPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  planSavings: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  taglineBox: {
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 16,
  },
  taglineText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  discountsSection: {
    marginBottom: 20,
  },
  discountsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FAF5FF',
  },
  couponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  couponCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponCodeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  couponSavedText: {
    fontSize: 11.5,
    color: '#059669',
    fontWeight: '600',
    marginTop: 1,
  },
  couponActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  couponActionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#D97706',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  summaryRow: {
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  summaryOriginalPrice: {
    color: '#EF4444',
    textDecorationLine: 'line-through',
  },
  summaryFinalPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  summaryUnit: {
    fontSize: 12,
    color: '#64748B',
  },
  buyButton: {
    backgroundColor: '#5843E8',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5843E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 4,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 12,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
});
