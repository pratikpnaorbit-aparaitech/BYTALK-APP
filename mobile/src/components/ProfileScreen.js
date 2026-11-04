import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

export const PRESET_AVATARS = [
  { id: 'av1', label: 'Tech Pro', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80' },
  { id: 'av2', label: 'Casual Boy', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80' },
  { id: 'av3', label: 'Professional', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
  { id: 'av4', label: 'Creative', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
  { id: 'av5', label: 'Cheerful Girl', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80' },
  { id: 'av6', label: 'Smart Girl', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
  { id: 'av7', label: 'Leader', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80' },
  { id: 'av8', label: 'Student', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80' },
  { id: 'av9', label: 'Cyber Bot', url: 'https://api.dicebear.com/7.x/bottts/png?seed=Felix&size=200' },
  { id: 'av10', label: 'AI Hero', url: 'https://api.dicebear.com/7.x/bottts/png?seed=Bella&size=200' },
  { id: 'av11', label: 'Adventurer', url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Alex&size=200' },
  { id: 'av12', label: 'Scholar', url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Sophie&size=200' },
  { id: 'av13', label: 'Explorer', url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Jack&size=200' },
  { id: 'av14', label: 'Gamer', url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Maya&size=200' },
];

export const PRESET_EMOJIS = [
  '😎', '👑', '🚀', '🔥', '⚡', '🦁', '🐯', '🐼', '🦊', '🦄',
  '🌟', '💎', '🎯', '🎧', '🏆', '🥇', '🥳', '😇', '🤩', '🤠',
  '🎮', '🎨', '🍕', '☕', '🧠', '🌍', '✈️', '🧘', '💪', '🌸',
  '🎸', '⚽', '🏀', '🎤', '🎬', '📚', '💡', '✨', '🌈', '🦋'
];

export const EMOJI_BG_COLORS = [
  { id: 'purple', color: '#6C5CE7', name: 'Royal Purple' },
  { id: 'coral', color: '#FF7675', name: 'Sunrise Coral' },
  { id: 'blue', color: '#0984E3', name: 'Deep Ocean' },
  { id: 'emerald', color: '#00B894', name: 'Emerald' },
  { id: 'gold', color: '#F59E0B', name: 'Golden Sun' },
  { id: 'pink', color: '#E84393', name: 'Cyber Pink' },
  { id: 'navy', color: '#1E293B', name: 'Obsidian' },
  { id: 'cyan', color: '#06B6D4', name: 'Aqua Cyan' },
];

// Reusable avatar renderer (handles emoji strings and image URLs)
export function renderAvatarContent(avatarUrl, style, textStyle) {
  if (!avatarUrl) {
    return <Image source={{ uri: DEFAULT_AVATAR }} style={style} />;
  }
  if (typeof avatarUrl === 'string' && avatarUrl.startsWith('emoji:')) {
    const parts = avatarUrl.split(':');
    const emoji = parts[1] || '😎';
    const bg = parts[2] || '#6C5CE7';
    return (
      <View style={[style, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={textStyle || { fontSize: 32 }}>{emoji}</Text>
      </View>
    );
  }
  return <Image source={{ uri: avatarUrl }} style={style} />;
}

export default function ProfileScreen({
  user,
  onBack,
  onPressGetPro,
  onUpdateProfile,
  onLogout,
  aryaSettings,
  onUpdateAryaSettings,
  isPro = false,
  subscription = null,
}) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarTab, setAvatarTab] = useState('avatars'); // 'avatars' | 'emojis'
  const [selectedEmoji, setSelectedEmoji] = useState('😎');
  const [selectedEmojiBg, setSelectedEmojiBg] = useState('#6C5CE7');

  const [editName, setEditName] = useState(user?.displayName || user?.name || 'Prateek Pawar');
  const [editEmail, setEditEmail] = useState(user?.email || 'pratikumeshpawar@gmail.com');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [giftClaimed, setGiftClaimed] = useState(false);

  // Avatar resolution
  const currentAvatar = user?.profilePhotoUrl || DEFAULT_AVATAR;

  // Subscription remaining days calculation
  const hasActiveSub = isPro || subscription?.active === true || ['basic', 'plus', 'pro', '1month', '3months', '1year'].includes(subscription?.plan?.id);
  const isBasicOnly = subscription?.plan?.id === 'basic';
  const planName = subscription?.plan?.name || (isBasicOnly ? 'Basic Calling' : 'BYTALK PRO');

  const getRemainingDays = () => {
    if (subscription?.remainingDays !== undefined && subscription?.remainingDays !== null && subscription?.remainingDays > 0) {
      return subscription.remainingDays;
    }
    if (subscription?.expiresAt) {
      const diff = new Date(subscription.expiresAt).getTime() - Date.now();
      return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    if (hasActiveSub) {
      return 30;
    }
    return 0;
  };

  const remainingDays = getRemainingDays();

  const formatExpiryDate = (dateVal) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  // ARYA Voice Settings
  const voice = aryaSettings?.voice || 'FEMALE';
  const voiceSpeed = aryaSettings?.speed || '1x';
  const nativeLang = aryaSettings?.nativeLanguage || user?.nativeLanguage || 'Other (English)';

  const toggleVoice = () => {
    const nextVoice = voice === 'FEMALE' ? 'MALE' : 'FEMALE';
    if (onUpdateAryaSettings) {
      onUpdateAryaSettings({ ...aryaSettings, voice: nextVoice });
    }
  };

  const cycleVoiceSpeed = () => {
    const speeds = ['0.75x', '1x', '1.25x'];
    const idx = speeds.indexOf(voiceSpeed);
    const nextSpeed = speeds[(idx + 1) % speeds.length];
    if (onUpdateAryaSettings) {
      onUpdateAryaSettings({ ...aryaSettings, speed: nextSpeed });
    }
  };

  const handleClaimGift = () => {
    if (giftClaimed) {
      Alert.alert('Gift Already Claimed', 'You already claimed your welcome bonus!');
      return;
    }
    setGiftClaimed(true);
    Alert.alert('🎁 Gift Claimed!', 'You have unlocked 100 free AI conversation stars and 20 practice minutes!');
  };

  const handleSelectPresetAvatar = (url) => {
    if (onUpdateProfile) {
      onUpdateProfile({ profilePhotoUrl: url });
    }
    setShowAvatarModal(false);
  };

  const handleApplyEmojiAvatar = () => {
    const emojiStr = `emoji:${selectedEmoji}:${selectedEmojiBg}`;
    if (onUpdateProfile) {
      onUpdateProfile({ profilePhotoUrl: emojiStr });
    }
    setShowAvatarModal(false);
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Please enter your name.');
      return;
    }
    if (onUpdateProfile) {
      onUpdateProfile({ name: editName.trim(), email: editEmail.trim() });
    }
    setShowEditModal(false);
  };

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
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <View style={styles.userCard}>
          {/* Avatar and Badge */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={() => setShowAvatarModal(true)}
              activeOpacity={0.8}
              style={styles.avatarTouchable}
              accessibilityRole="button"
              accessibilityLabel="Change avatar or emoji"
            >
              <View style={styles.avatarCircleBorder}>
                {renderAvatarContent(currentAvatar, styles.avatarImg, { fontSize: 32 })}
              </View>
              {/* Camera / Edit Badge Overlay */}
              <View style={styles.cameraIconBadge}>
                <Ionicons name="camera" size={11} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <View style={[
              styles.memberBadge,
              hasActiveSub && (isBasicOnly ? styles.memberBadgeBasic : styles.memberBadgePro),
            ]}>
              <Text style={[
                styles.memberBadgeText,
                hasActiveSub && (isBasicOnly ? styles.memberBadgeTextBasic : styles.memberBadgeTextPro),
              ]}>
                {hasActiveSub
                  ? (isBasicOnly ? 'Basic Calling 📞' : 'PRO Member 👑')
                  : 'Free Member'}
              </Text>
            </View>
          </View>

          {/* User Details */}
          <View style={styles.userDetailsCol}>
            <View style={styles.userNameRow}>
              <Text style={styles.userNameText} numberOfLines={1}>
                {user?.displayName || user?.name || 'Prateek Pawar'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(true)}
                style={styles.editPenCircle}
                accessibilityRole="button"
                accessibilityLabel="Edit profile details"
              >
                <Ionicons name="pencil" size={13} color="#92400E" />
              </TouchableOpacity>
            </View>

            <Text style={styles.userEmailText} numberOfLines={1}>
              {user?.email || 'pratikumeshpawar@gmail.com'}
            </Text>

            {hasActiveSub ? (
              <View style={styles.remainingPillRow}>
                <View style={styles.daysRemainingTag}>
                  <Text style={styles.daysRemainingTagText}>
                    🔥 {remainingDays} {remainingDays === 1 ? 'Day' : 'Days'} Remaining
                  </Text>
                </View>
                {subscription?.expiresAt ? (
                  <Text style={styles.expiryNoteText}>
                    Till {formatExpiryDate(subscription.expiresAt)}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.memberSinceText}>
                Member since Jan, 2025
              </Text>
            )}
          </View>
        </View>

        {/* Subscription / Pro Banner Card */}
        {hasActiveSub ? (
          <View style={styles.activeSubCard}>
            <View style={styles.activeSubTopRow}>
              <View style={styles.activeSubLeftCol}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.activeSubTitleIcon}>{isBasicOnly ? '📞' : '👑'}</Text>
                  <Text style={styles.activeSubTitle}>{planName}</Text>
                  <View style={styles.activeLivePill}>
                    <Text style={styles.activeLivePillText}>ACTIVE</Text>
                  </View>
                </View>
                <Text style={styles.activeSubSubtitle}>
                  {subscription?.expiresAt
                    ? `Valid until ${formatExpiryDate(subscription.expiresAt)} • One-time plan`
                    : 'All premium features unlocked'}
                </Text>
              </View>

              {/* Big Days Remaining Box */}
              <View style={styles.daysCounterBox}>
                <Text style={styles.daysCounterNumber}>{remainingDays}</Text>
                <Text style={styles.daysCounterLabel}>Days Left</Text>
              </View>
            </View>

            {/* Visual Time Progress Bar */}
            <View style={styles.subProgressBarBg}>
              <LinearGradient
                colors={isBasicOnly ? ['#10B981', '#059669'] : ['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.subProgressBarFill,
                  { width: `${Math.min(100, Math.max(8, (remainingDays / 30) * 100))}%` },
                ]}
              />
            </View>

            {/* Bottom Actions Row */}
            <View style={styles.activeSubFooter}>
              <Text style={styles.activeSubFeatures}>
                {isBasicOnly
                  ? '✓ 1-on-1 Voice Calling • Unlimited ARYA AI'
                  : '✓ Unlimited ARYA AI • HD Video Calling • Priority Match'}
              </Text>
              <TouchableOpacity
                onPress={onPressGetPro}
                style={styles.extendPlanBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.extendPlanBtnText}>Extend Plan</Text>
                <Ionicons name="chevron-forward" size={13} color="#5843E8" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.proBannerCard}>
            <View>
              <Text style={styles.proBannerTitle}>BYTALK Pro</Text>
              <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                Unlimited Calls & ARYA AI Practice
              </Text>
            </View>
            <TouchableOpacity
              onPress={onPressGetPro}
              style={styles.noAutopayBtn}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.noAutopayGradient}
              >
                <Text style={styles.noAutopayText}>No Autopay Plans</Text>
                <Ionicons name="chevron-forward" size={14} color="#FFFFFF" style={{ marginLeft: 2 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ARYA Settings Header */}
        <Text style={styles.sectionHeader}>ARYA Settings</Text>

        {/* ARYA Settings White Box */}
        <View style={styles.settingsBox}>
          {/* Row 1: ARYA Voice */}
          <TouchableOpacity
            onPress={toggleVoice}
            style={styles.settingRow}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="volume-medium-outline" size={22} color="#6C5CE7" />
              <Text style={styles.settingLabel}>ARYA Voice</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>{voice}</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          {/* Row 2: ARYA Voice Speed */}
          <TouchableOpacity
            onPress={cycleVoiceSpeed}
            style={styles.settingRow}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="speedometer-outline" size={22} color="#6C5CE7" />
              <Text style={styles.settingLabel}>ARYA Voice Speed</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>{voiceSpeed}</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          {/* Row 3: Native Language */}
          <TouchableOpacity
            onPress={() => setShowLanguageModal(true)}
            style={styles.settingRow}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="language-outline" size={22} color="#6C5CE7" />
              <Text style={styles.settingLabel}>Native Language</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue} numberOfLines={1}>{nativeLang}</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Discover Lovish Promo Card */}
        <LinearGradient
          colors={['#FFE4F0', '#F3E8FF', '#EDE9FE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.lovishPromoCard}
        >
          <View style={styles.lovishRow}>
            <View style={styles.lovishTextCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.lovishHeart}>💖</Text>
                <Text style={styles.lovishTitle}>Discover Lovish</Text>
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              </View>
              <Text style={styles.lovishSubtitle}>
                Your AI friend for meaningful conversations
              </Text>
            </View>
            <Text style={{ fontSize: 34 }}>🎁</Text>
          </View>

          <TouchableOpacity
            onPress={handleClaimGift}
            style={styles.claimGiftBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.claimGiftBtnText}>
              {giftClaimed ? 'Gift Claimed ✓' : 'Claim Your Gift'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Log Out Button */}
        <TouchableOpacity
          onPress={onLogout}
          style={styles.logoutButton}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Log out of BYTALK"
        >
          <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ======================================================== */}
      {/* MODAL 1: AVATAR & EMOJI CUSTOMIZATION MODAL */}
      {/* ======================================================== */}
      <Modal
        visible={showAvatarModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '86%' }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Avatar / Emoji</Text>
              <TouchableOpacity
                onPress={() => setShowAvatarModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Current Avatar Live Preview Box */}
            <View style={styles.avatarPreviewBanner}>
              <View style={styles.previewCircle}>
                {avatarTab === 'emojis' ? (
                  <View style={[styles.avatarImg, { backgroundColor: selectedEmojiBg, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 44 }}>{selectedEmoji}</Text>
                  </View>
                ) : (
                  renderAvatarContent(currentAvatar, styles.avatarImg, { fontSize: 38 })
                )}
              </View>
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1D2E' }}>
                  {user?.displayName || 'Your Profile Avatar'}
                </Text>
                <Text style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
                  {avatarTab === 'emojis' ? 'Custom Emoji Profile' : 'Select from 3D avatars below'}
                </Text>
              </View>
            </View>

            {/* Tab Switcher: Avatars vs Emojis */}
            <View style={styles.avatarTabSwitcher}>
              <TouchableOpacity
                onPress={() => setAvatarTab('avatars')}
                style={[styles.avatarTabBtn, avatarTab === 'avatars' && styles.avatarTabBtnActive]}
              >
                <Text style={[styles.avatarTabBtnText, avatarTab === 'avatars' && styles.avatarTabBtnTextActive]}>
                  🎭 3D Avatars
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAvatarTab('emojis')}
                style={[styles.avatarTabBtn, avatarTab === 'emojis' && styles.avatarTabBtnActive]}
              >
                <Text style={[styles.avatarTabBtnText, avatarTab === 'emojis' && styles.avatarTabBtnTextActive]}>
                  😊 Expressive Emojis
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 0, maxHeight: 340 }}>
              {avatarTab === 'avatars' ? (
                /* TAB 1: 3D & Characters Grid */
                <View style={styles.avatarsGrid}>
                  {PRESET_AVATARS.map((av) => {
                    const isSelected = currentAvatar === av.url;
                    return (
                      <TouchableOpacity
                        key={av.id}
                        onPress={() => handleSelectPresetAvatar(av.url)}
                        style={[styles.avatarGridItem, isSelected && styles.avatarGridItemSelected]}
                        activeOpacity={0.7}
                      >
                        <Image source={{ uri: av.url }} style={styles.gridAvatarImg} />
                        {isSelected && (
                          <View style={styles.checkCircle}>
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                          </View>
                        )}
                        <Text style={styles.avatarGridLabel} numberOfLines={1}>{av.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                /* TAB 2: Expressive Emojis & Background Color Palette */
                <View>
                  <Text style={styles.emojiSectionHeading}>1. Pick Background Color:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 4 }}>
                      {EMOJI_BG_COLORS.map((bg) => {
                        const isBgSelected = selectedEmojiBg === bg.color;
                        return (
                          <TouchableOpacity
                            key={bg.id}
                            onPress={() => setSelectedEmojiBg(bg.color)}
                            style={[
                              styles.colorCircle,
                              { backgroundColor: bg.color },
                              isBgSelected && styles.colorCircleSelected,
                            ]}
                          >
                            {isBgSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>

                  <Text style={styles.emojiSectionHeading}>2. Choose Emoji Avatar or Type Your Own:</Text>
                  <View style={styles.customEmojiInputRow}>
                    <Text style={styles.customEmojiLabel}>Custom:</Text>
                    <TextInput
                      style={styles.customEmojiInput}
                      value={selectedEmoji}
                      onChangeText={(txt) => {
                        if (txt) {
                          const chars = Array.from(txt.trim());
                          if (chars.length > 0) setSelectedEmoji(chars[chars.length - 1]);
                        }
                      }}
                      placeholder="Type any emoji (e.g. 🦊)"
                      placeholderTextColor="#94A3B8"
                      maxLength={4}
                    />
                    <View style={[styles.customEmojiPreviewPill, { backgroundColor: selectedEmojiBg }]}>
                      <Text style={{ fontSize: 20 }}>{selectedEmoji}</Text>
                    </View>
                  </View>

                  <View style={styles.emojisGrid}>
                    {PRESET_EMOJIS.map((em, idx) => {
                      const isEmojiSelected = selectedEmoji === em;
                      return (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => setSelectedEmoji(em)}
                          style={[
                            styles.emojiGridItem,
                            isEmojiSelected && styles.emojiGridItemSelected,
                          ]}
                        >
                          <Text style={{ fontSize: 28 }}>{em}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    onPress={handleApplyEmojiAvatar}
                    style={[styles.saveProfileBtn, { marginTop: 16, backgroundColor: '#5843E8' }]}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.saveProfileBtnText}>
                      Set {selectedEmoji} As My Avatar
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: EDIT NAME / DETAILS MODAL */}
      {/* ======================================================== */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Quick Avatar Change Button inside Edit Profile */}
            <TouchableOpacity
              onPress={() => {
                setShowEditModal(false);
                setTimeout(() => setShowAvatarModal(true), 250);
              }}
              style={styles.changeAvatarRow}
              activeOpacity={0.7}
            >
              <View style={[styles.avatarCircleBorder, { width: 44, height: 44, borderRadius: 22, marginRight: 12 }]}>
                {renderAvatarContent(currentAvatar, styles.avatarImg, { fontSize: 22 })}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1D2E' }}>Profile Avatar / Emoji</Text>
                <Text style={{ fontSize: 12, color: '#5843E8' }}>Tap to choose from 3D characters or emojis</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your Name"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: '#F8FAFC', color: '#64748B' }]}
              value={editEmail}
              editable={false}
              placeholder="Email"
              placeholderTextColor="#94A3B8"
            />

            <TouchableOpacity
              onPress={handleSaveProfile}
              style={styles.saveProfileBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.saveProfileBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 3: NATIVE LANGUAGE PICKER */}
      {/* ======================================================== */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Native Language</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                'Other (English)',
                'Hindi (हिन्दी)',
                'Spanish (Español)',
                'French (Français)',
                'Arabic (العربية)',
                'German (Deutsch)',
                'Portuguese (Português)',
                'Japanese (日本語)',
                'Russian (Русский)',
                'Korean (한국어)',
                'Bengali (বাংলা)',
                'Marathi (मराठी)',
                'Tamil (தமிழ்)',
                'Telugu (తెలుగు)',
                'Gujarati (ગુજરાતી)',
              ].map((lang) => (
                <TouchableOpacity
                  key={lang}
                  onPress={() => {
                    if (onUpdateAryaSettings) {
                      onUpdateAryaSettings({ ...aryaSettings, nativeLanguage: lang });
                    }
                    setShowLanguageModal(false);
                  }}
                  style={styles.langItem}
                >
                  <Text style={[styles.langItemText, nativeLang === lang && { color: '#5843E8', fontWeight: '800' }]}>
                    {lang}
                  </Text>
                  {nativeLang === lang && (
                    <Ionicons name="checkmark-circle" size={18} color="#5843E8" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    paddingTop: Platform.OS === 'ios' ? 48 : 14,
    paddingBottom: 10,
    backgroundColor: '#FAF9FE',
  },
  backButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    zIndex: 999,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1D2E',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEBF5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 14,
  },
  avatarSection: {
    alignItems: 'center',
    marginRight: 14,
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatarCircleBorder: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2.5,
    borderColor: '#7C5DF9',
    backgroundColor: '#E8E4FD',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#5843E8',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberBadge: {
    backgroundColor: '#EEECFE',
    borderWidth: 1,
    borderColor: '#7C5DF9',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: -8,
  },
  memberBadgeBasic: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  memberBadgePro: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  memberBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#5843E8',
  },
  memberBadgeTextBasic: {
    color: '#047857',
  },
  memberBadgeTextPro: {
    color: '#B45309',
  },
  userDetailsCol: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userNameText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1D2E',
    flex: 1,
  },
  editPenCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userEmailText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  memberSinceText: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 6,
  },
  remainingPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  daysRemainingTag: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  daysRemainingTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  expiryNoteText: {
    fontSize: 11,
    color: '#64748B',
  },
  activeSubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
    shadowColor: '#5843E8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  activeSubTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  activeSubLeftCol: {
    flex: 1,
  },
  activeSubTitleIcon: {
    fontSize: 18,
  },
  activeSubTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1D2E',
  },
  activeLivePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  activeLivePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
  },
  activeSubSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  daysCounterBox: {
    backgroundColor: '#EEECFE',
    borderWidth: 1.5,
    borderColor: '#7C5DF9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  daysCounterNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#5843E8',
    lineHeight: 22,
  },
  daysCounterLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#7C5DF9',
    textTransform: 'uppercase',
  },
  subProgressBarBg: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  subProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  activeSubFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  activeSubFeatures: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    flex: 1,
  },
  extendPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEECFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginLeft: 8,
  },
  extendPlanBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#5843E8',
    marginRight: 2,
  },
  proBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#ECEBF5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 20,
  },
  proBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1D2E',
  },
  noAutopayBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  noAutopayGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  noAutopayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1D2E',
    marginBottom: 10,
  },
  settingsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECEBF5',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1A1D2E',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1A1D2E',
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
  lovishPromoCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  lovishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  lovishTextCol: {
    flex: 1,
  },
  lovishHeart: {
    fontSize: 15,
  },
  lovishTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#6B21A8',
  },
  newBadge: {
    backgroundColor: '#581C87',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  lovishSubtitle: {
    fontSize: 12,
    color: '#7E22CE',
    marginTop: 4,
    lineHeight: 16,
  },
  claimGiftBtn: {
    backgroundColor: '#6B21A8',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimGiftBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    paddingVertical: 12,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1D2E',
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 11,
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 14,
  },
  saveProfileBtn: {
    backgroundColor: '#5843E8',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  saveProfileBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  langItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  changeAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEECFE',
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D8D4FD',
  },
  avatarPreviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  previewCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: '#5843E8',
    overflow: 'hidden',
  },
  avatarTabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  avatarTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  avatarTabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarTabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  avatarTabBtnTextActive: {
    color: '#5843E8',
  },
  avatarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  avatarGridItem: {
    width: '30%',
    alignItems: 'center',
    padding: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  avatarGridItemSelected: {
    borderColor: '#5843E8',
    backgroundColor: '#EEECFE',
  },
  gridAvatarImg: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginBottom: 4,
  },
  checkCircle: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#5843E8',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarGridLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  emojiSectionHeading: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 8,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#1E293B',
    transform: [{ scale: 1.1 }],
  },
  customEmojiInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  customEmojiLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 6,
  },
  customEmojiInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    paddingVertical: 6,
  },
  customEmojiPreviewPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  emojiGridItem: {
    width: '17%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emojiGridItemSelected: {
    borderColor: '#5843E8',
    backgroundColor: '#EEECFE',
    transform: [{ scale: 1.1 }],
  },
});
