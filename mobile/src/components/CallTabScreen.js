import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const REGION_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'europe', label: 'Europe' },
  { id: 'asia', label: 'Asia' },
  { id: 'americas', label: 'Americas' },
  { id: 'africa', label: 'Africa' },
  { id: 'middle-east', label: 'Middle East' },
];

export default function CallTabScreen({
  onStartRandomMatch,
  isMatching = false,
  isSubscribed = false,
  freeTrialSecondsRemaining = 300,
  onPressUpgrade,
  onBack,
}) {
  const [selectedGender, setSelectedGender] = useState(isSubscribed ? 'female' : 'all');
  const [selectedLevel, setSelectedLevel] = useState('beginner'); // 'beginner' | 'advanced'
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [showRegionModal, setShowRegionModal] = useState(false);

  const handleSelectGender = (gender) => {
    if (!isSubscribed) {
      Alert.alert(
        'PRO Feature 👑',
        'Filtering calls by gender (Female or Male) requires an active PRO subscription. Upgrade to PRO to choose your partner\'s gender!',
        [
          { text: 'Upgrade to PRO 👑', onPress: onPressUpgrade },
          { text: 'Use Any Gender', style: 'cancel' },
        ]
      );
      return;
    }
    setSelectedGender(gender);
  };

  const handleStartTalk = () => {
    if (onStartRandomMatch) {
      onStartRandomMatch({
        gender: isSubscribed ? selectedGender : 'all',
        level: selectedLevel,
        region: selectedRegion,
      });
    }
  };

  const regionLabel = REGION_OPTIONS.find((r) => r.id === selectedRegion)?.label || 'All';
  const remainingMinutes = Math.max(0, Math.ceil(freeTrialSecondsRemaining / 60));
  const freeTrialExpired = !isSubscribed && freeTrialSecondsRemaining <= 0;

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= HEADER: Speaking Practice (Image 1) ================= */}
        <View style={styles.headerArea}>
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={styles.headerBackBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}

          <Text style={styles.headerTitle}>Speaking Practice</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* ================= FILTER FORM (Exact match to Image 1) ================= */}
        <View style={styles.filterSection}>
          {/* Gender Filter Row */}
          <View style={styles.filterRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.filterLabel}>Gender :</Text>
              {!isSubscribed && (
                <View style={styles.proCrownBadge}>
                  <Text style={styles.proCrownText}>👑 PRO</Text>
                </View>
              )}
            </View>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                onPress={() => handleSelectGender('female')}
                style={styles.radioOption}
                activeOpacity={0.7}
              >
                <View style={[styles.radioCircle, selectedGender === 'female' && styles.radioCircleActive]}>
                  {selectedGender === 'female' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioText}>Female</Text>
                {!isSubscribed && (
                  <Ionicons name="lock-closed" size={11} color="#D97706" style={{ marginLeft: 3 }} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSelectGender('male')}
                style={styles.radioOption}
                activeOpacity={0.7}
              >
                <View style={[styles.radioCircle, selectedGender === 'male' && styles.radioCircleActive]}>
                  {selectedGender === 'male' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioText}>Male</Text>
                {!isSubscribed && (
                  <Ionicons name="lock-closed" size={11} color="#D97706" style={{ marginLeft: 3 }} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Level Filter Row */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Level :</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                onPress={() => setSelectedLevel('beginner')}
                style={styles.radioOption}
                activeOpacity={0.7}
              >
                <View style={[styles.radioCircle, selectedLevel === 'beginner' && styles.radioCircleActive]}>
                  {selectedLevel === 'beginner' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioText}>Beginner</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedLevel('advanced')}
                style={styles.radioOption}
                activeOpacity={0.7}
              >
                <View style={[styles.radioCircle, selectedLevel === 'advanced' && styles.radioCircleActive]}>
                  {selectedLevel === 'advanced' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioText}>Advanced</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Region Filter Row */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Region :</Text>
            <TouchableOpacity
              onPress={() => setShowRegionModal(true)}
              style={styles.regionPill}
              activeOpacity={0.8}
            >
              <Text style={styles.regionPillText}>{regionLabel}</Text>
              <Ionicons name="arrow-down" size={13} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Big Start Talk Button (Image 1) */}
          <TouchableOpacity
            onPress={handleStartTalk}
            disabled={isMatching}
            style={[styles.startTalkBtn, isMatching && { opacity: 0.85 }]}
            activeOpacity={0.9}
          >
            {isMatching ? (
              <View style={styles.startTalkBtnContent}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.startTalkBtnText}>Connecting Partner...</Text>
              </View>
            ) : (
              <Text style={styles.startTalkBtnText}>Start Talk</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Free 5 Minutes Trial & Subscription Status Banner */}
        {!isSubscribed ? (
          <TouchableOpacity
            onPress={onPressUpgrade}
            style={[
              styles.trialCard,
              freeTrialExpired && styles.trialCardExpired,
            ]}
            activeOpacity={0.88}
          >
            <View style={styles.trialCardLeft}>
              <View style={[styles.trialBadge, freeTrialExpired && { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.trialBadgeText, freeTrialExpired && { color: '#DC2626' }]}>
                  {freeTrialExpired ? 'Trial Expired' : 'Free Trial'}
                </Text>
              </View>
              <Text style={styles.trialTitle}>
                {freeTrialExpired
                  ? 'First 5 Free Minutes Used'
                  : `First 5 Min Free (${remainingMinutes} min left)`}
              </Text>
              <Text style={styles.trialSubtitle}>
                {freeTrialExpired
                  ? 'Buy a subscription to continue speaking practice'
                  : 'Every new user gets first 5 minutes free • Buy for unlimited'}
              </Text>
            </View>

            <View style={[styles.trialBtn, freeTrialExpired && { backgroundColor: '#DC2626' }]}>
              <Text style={styles.trialBtnText}>
                {freeTrialExpired ? 'Buy Plan' : 'Subscribe'}
              </Text>
              <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.subscribedBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <Text style={styles.subscribedText}>
              👑 Active Subscription: Unlimited Voice & Video Practice
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Region Picker Modal */}
      <Modal
        visible={showRegionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRegionModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRegionModal(false)}
        >
          <View style={styles.regionModalCard}>
            <Text style={styles.regionModalTitle}>Select Region</Text>
            {REGION_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  setSelectedRegion(item.id);
                  setShowRegionModal(false);
                }}
                style={[
                  styles.regionOptionRow,
                  selectedRegion === item.id && styles.regionOptionRowActive,
                ]}
              >
                <Text
                  style={[
                    styles.regionOptionText,
                    selectedRegion === item.id && styles.regionOptionTextActive,
                  ]}
                >
                  {item.label}
                </Text>
                {selectedRegion === item.id && (
                  <Ionicons name="checkmark" size={18} color="#0284C7" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#EAF4FC', // Soft sky blue matching reference Image 1
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    marginBottom: 8,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  filterSection: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
  },
  filterLabel: {
    width: 78,
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  proCrownBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  proCrownText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  radioGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioCircleActive: {
    borderColor: '#007AFF',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  radioText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
  },
  regionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#8E84CE', // Violet rounded pill matching reference Image 1
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
    shadowColor: '#8E84CE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  regionPillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  startTalkBtn: {
    marginTop: 28,
    backgroundColor: '#007AFF', // Vibrant blue matching Image 1
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startTalkBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startTalkBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  trialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    borderRadius: 18,
    padding: 14,
    marginTop: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  trialCardExpired: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF5F5',
  },
  trialCardLeft: {
    flex: 1,
    paddingRight: 10,
  },
  trialBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  trialBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  trialTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  trialSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  trialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  trialBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  subscribedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 24,
  },
  subscribedText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#065F46',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  regionModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    width: '100%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  regionModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },
  regionOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  regionOptionRowActive: {
    backgroundColor: '#E0F2FE',
  },
  regionOptionText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  regionOptionTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
});
