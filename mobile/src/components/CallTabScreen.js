import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Image,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const PRACTICE_GUIDELINES = [
  { icon: '⏱️', color: '#E0F2FE', title: 'Practice Daily', text: 'Just 10 minutes of English practice every day can make a difference.' },
  { icon: '🤝', color: '#FEF3C7', title: 'Learn Together', text: 'Support and encourage fellow English learners.' },
  { icon: '🗣️', color: '#EDE9FE', title: 'Speak Confidently', text: "Don't worry about mistakes. Every conversation helps you improve." },
  { icon: '🔒', color: '#FEF9C3', title: 'Stay Safe', text: 'Never share personal or sensitive information.' },
  { icon: '👂', color: '#DCFCE7', title: 'Listen & Respect', text: 'Give everyone a chance to speak and express themselves.' },
  { icon: '⭐', color: '#FCE7F3', title: 'Rate Honestly', text: 'Share fair ratings and helpful feedback.' },
  { icon: '📅', color: '#E0E7FF', title: 'Stay Consistent', text: 'Small daily efforts lead to big improvements.' },
  { icon: '💬', color: '#CCFBF1', title: 'Be Friendly', text: 'Keep conversations positive, polite, and respectful.' },
];

export default function CallTabScreen({
  onStartRandomMatch,
  isMatching = false,
  isSubscribed = false,
  preferredCallGender = 'any',
  freeTrialSecondsRemaining = 600,
  dailyFreeSecondsLimit = 600,
  connectedCallsCount = 0,
  freeTrialResetAt = null,
  progressStats = null,
  progressError = '',
  onPressUpgrade,
  onBack,
  currentUser = {},
  onPressLeaderboard,
  onPressStreak,
  friends = [],
  pendingRequests = [],
  sentRequests = [],
  allPartners = [],
  onDirectCall,
  onDirectVideoCall,
  onDirectChat,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  onCancelFriendRequest,
  onRemoveFriend,
  recentCoLearners = [],
  onCancelMatch,
  onRefreshFriends,
}) {
  const [friendsRefreshing, setFriendsRefreshing] = useState(false);
  const [pendingFriendRemoval, setPendingFriendRemoval] = useState(null);
  const [bottomCardMinimized, setBottomCardMinimized] = useState(false);
  const [clockNow, setClockNow] = useState(Date.now());

  const handleRefreshFriends = async () => {
    if (onRefreshFriends) {
      setFriendsRefreshing(true);
      try {
        await onRefreshFriends();
      } catch {}
      setFriendsRefreshing(false);
    }
  };
  const confirmRemoveFriend = (friend) => {
    setPendingFriendRemoval(String(friend.id || friend._id || friend.name || ''));
  };
  const [activeTopTab, setActiveTopTab] = useState('practice'); // 'practice' | 'friends' | 'progress'
  const initialCallGender = ['male', 'female', 'any'].includes(preferredCallGender) ? preferredCallGender : 'any';
  const [selectedGender, setSelectedGender] = useState(initialCallGender);
  const [searchFriendText, setSearchFriendText] = useState('');
  const [sentMap, setSentMap] = useState({});

  useEffect(() => {
    setSelectedGender(['male', 'female', 'any'].includes(preferredCallGender) ? preferredCallGender : 'any');
  }, [preferredCallGender]);

  // Animated pulse for radar matching (Image 4)
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const pulseAnim3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isMatching) {
      const createPulse = (anim, delay) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1.25,
              duration: 1400,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 1,
              duration: 1400,
              useNativeDriver: true,
            }),
          ])
        );
      };
      const a1 = createPulse(pulseAnim1, 0);
      const a2 = createPulse(pulseAnim2, 350);
      const a3 = createPulse(pulseAnim3, 700);
      a1.start();
      a2.start();
      a3.start();

      return () => {
        a1.stop();
        a2.stop();
        a3.stop();
      };
    }
  }, [isMatching]);

  const handleSelectGender = (gender) => {
    if (gender !== 'any' && !isSubscribed) {
      if (onPressUpgrade) {
        onPressUpgrade();
      }
      return;
    }
    setSelectedGender(gender);
  };

  const handleStartTalk = () => {
    if (!isSubscribed && freeTrialSecondsRemaining <= 0) return;
    if (onStartRandomMatch) {
      onStartRandomMatch({
        gender: isSubscribed ? (selectedGender === 'any' ? 'all' : selectedGender) : 'all',
        level: 'beginner',
        region: 'all',
      });
    }
  };

  const handleSendRequestLocal = async (targetUser) => {
    const uid = targetUser.id || targetUser._id || targetUser.name || targetUser.displayName;
    if (onSendFriendRequest) {
      const requestSent = await onSendFriendRequest(targetUser);
      if (requestSent === false) return;
    } else {
      Alert.alert('Friend Request Sent! 🤝', `Your friend request has been sent to ${targetUser.name || 'Co-learner'}.`);
    }
    setSentMap((prev) => ({ ...prev, [uid]: true }));
  };

  const userName = currentUser?.displayName || currentUser?.name || 'Prateek';
  const userAvatar = currentUser?.avatarUrl || currentUser?.profilePhotoUrl || 'https://api.dicebear.com/7.x/avataaars/png?seed=Prateek&top=shortFlat&clothingColor=blue01';
  const streakCount = currentUser?.streak ?? 0;
  const remainingSeconds = Math.max(0, freeTrialSecondsRemaining);
  const remMinutes = Math.floor(remainingSeconds / 60);
  const remSeconds = remainingSeconds % 60;
  const timerDisplay = `${String(remMinutes).padStart(2, '0')}:${String(remSeconds).padStart(2, '0')}`;
  const usedSeconds = Math.max(0, dailyFreeSecondsLimit - remainingSeconds);
  const progressRatio = isSubscribed ? 1 : Math.min(1, Math.max(0, usedSeconds / dailyFreeSecondsLimit));
  const dailyLimitReached = !isSubscribed && remainingSeconds <= 0;
  const resetTimestamp = Date.parse(freeTrialResetAt || '');
  const cooldownSecondsRemaining = dailyLimitReached && Number.isFinite(resetTimestamp)
    ? Math.max(0, Math.ceil((resetTimestamp - clockNow) / 1000))
    : null;
  const cooldownDisplay = cooldownSecondsRemaining === null
    ? '24 hours'
    : `${Math.floor(cooldownSecondsRemaining / 3600)}h ${String(Math.floor((cooldownSecondsRemaining % 3600) / 60)).padStart(2, '0')}m`;
  const completedCallsCount = progressStats?.completedCalls ?? null;
  const ratingsReceived = Number(progressStats?.ratingsReceived) || 0;
  const averageRating = progressStats?.averageRating != null && Number.isFinite(Number(progressStats.averageRating))
    ? Number(progressStats.averageRating)
    : null;
  const politeFeedbackCount = Number(progressStats?.politeFeedbackCount) || 0;
  const earnedBadges = [];

  if (politeFeedbackCount >= 3) earnedBadges.push({ icon: '🤝', title: 'Polite Learner' });
  if (completedCallsCount >= 10 && ratingsReceived >= 5 && averageRating >= 4.5) {
    earnedBadges.push({ icon: '🗣️', title: 'Fluent Speaker' });
  }
  if (streakCount >= 7) earnedBadges.push({ icon: '⏱️', title: 'Active Daily' });

  useEffect(() => {
    if (!dailyLimitReached || !freeTrialResetAt) return undefined;
    const timer = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [dailyLimitReached, freeTrialResetAt]);

  // Deduplicated data sets
  const uniqueFriends = Array.from(
    new Map((friends || []).map((f) => [String(f.id || f.name), f])).values()
  );
  const uniquePendingRequests = Array.from(
    new Map((pendingRequests || []).map((r) => [String(r.id || r._id || r.requestId || r.from?.id || r.from?.name || Math.random()), r])).values()
  );
  const uniqueSentRequests = Array.from(
    new Map((sentRequests || []).map((r) => [String(r.id || r._id || r.requestId || r.to?.id || r.to?.name || Math.random()), r])).values()
  ).filter((r) => {
    const toName = (r.to?.name || r.to?.displayName || '').trim().toLowerCase();
    const myName = (currentUser?.name || currentUser?.displayName || '').trim().toLowerCase();
    const toId = String(r.to?.id || r.to?._id || '');
    const myId = String(currentUser?.id || currentUser?._id || '');
    if (myName && toName && toName === myName) return false;
    if (myId && toId && toId === myId) return false;
    return true;
  });
  const uniqueRecentCoLearners = Array.from(
    new Map((recentCoLearners || []).map((r) => [String(r.id || r.name), r])).values()
  );

  const checkIsFriendLocal = (learner) => {
    if (!learner) return false;
    const lId = String(learner.id || learner._id || learner.userId || '');
    const lName = String(learner.displayName || learner.name || '').trim().toLowerCase();
    return uniqueFriends.some((f) => {
      const fId = String(f.id || f._id || f.userId || '');
      const fName = String(f.displayName || f.name || '').trim().toLowerCase();
      if (lId && fId && lId === fId) return true;
      if (lName && fName && lName === fName) return true;
      return false;
    });
  };

  const findIncomingReqLocal = (learner) => {
    if (!learner) return null;
    const lId = String(learner.id || learner._id || learner.userId || '');
    const lName = String(learner.displayName || learner.name || '').trim().toLowerCase();
    return uniquePendingRequests.find((r) => {
      const fromId = String(r.from?.id || r.from?._id || r.from?.userId || '');
      const fromName = String(r.from?.displayName || r.from?.name || '').trim().toLowerCase();
      if (lId && fromId && lId === fromId) return true;
      if (lName && fromName && lName === fromName) return true;
      return false;
    });
  };

  const findIsSentLocal = (learner) => {
    if (!learner) return false;
    const uid = learner.id || learner._id || learner.name || learner.displayName;
    if (sentMap[uid]) return true;
    const lId = String(learner.id || learner._id || learner.userId || '');
    const lName = String(learner.displayName || learner.name || '').trim().toLowerCase();
    return uniqueSentRequests.some((s) => {
      const toId = String(s.to?.id || s.to?._id || s.to?.userId || '');
      const toName = String(s.to?.displayName || s.to?.name || '').trim().toLowerCase();
      if (lId && toId && lId === toId) return true;
      if (lName && toName && lName === toName) return true;
      return false;
    });
  };

  const renderActionForLearner = (learner) => {
    const isFriend = checkIsFriendLocal(learner);
    const incomingReq = findIncomingReqLocal(learner);
    const isSent = findIsSentLocal(learner);

    if (isFriend) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[styles.addFriendBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
            <Ionicons name="checkmark-circle" size={14} color="#166534" style={{ marginRight: 4 }} />
            <Text style={[styles.addFriendBtnText, { color: '#166534' }]}>Friends</Text>
          </View>
          <TouchableOpacity
            onPress={() => onDirectChat && onDirectChat(learner)}
            style={[styles.addFriendBtn, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={13} color="#4F46E5" style={{ marginRight: 3 }} />
            <Text style={[styles.addFriendBtnText, { color: '#4F46E5' }]}>Chat</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (incomingReq) {
      return (
        <TouchableOpacity
          onPress={() => onAcceptFriendRequest && onAcceptFriendRequest(incomingReq)}
          style={[styles.addFriendBtn, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-sharp" size={14} color="#15803D" style={{ marginRight: 4 }} />
          <Text style={[styles.addFriendBtnText, { color: '#15803D' }]}>Accept</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        onPress={() => handleSendRequestLocal(learner)}
        disabled={isSent}
        style={[styles.addFriendBtn, isSent && styles.addFriendBtnSent]}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isSent ? 'checkmark' : 'person-add'}
          size={14}
          color={isSent ? '#166534' : '#6366F1'}
          style={{ marginRight: 4 }}
        />
        <Text style={[styles.addFriendBtnText, isSent && { color: '#166534' }]}>
          {isSent ? 'Sent' : 'Add Friend'}
        </Text>
      </TouchableOpacity>
    );
  };

  // Filtered friends & searched co-learners
  const searchLower = searchFriendText.trim().toLowerCase();
  const filteredFriends = uniqueFriends.filter((f) =>
    (f.name || f.displayName || '').toLowerCase().includes(searchLower)
  );
  const searchedCoLearners = (allPartners || []).filter((p) => {
    if (!searchLower) return false;
    const nameMatch = (p.name || p.displayName || '').toLowerCase().includes(searchLower);
    const isAlreadyFriend = uniqueFriends.some((f) => String(f.id) === String(p.id) || f.name === p.name);
    return nameMatch && !isAlreadyFriend;
  });

  return (
    <View style={styles.screenContainer}>
      {/* ================= HEADER (IMAGE 5) ================= */}
      <View style={styles.topHeader}>
        {/* Left: User Avatar + Overlapping Menu Badge */}
        <View style={styles.userProfileWrapper}>
          <Image source={{ uri: userAvatar }} style={styles.userAvatarImg} />
          <TouchableOpacity
            style={styles.menuBadgeCircle}
            activeOpacity={0.8}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Menu"
          >
            <Ionicons name="menu" size={14} color="#6366F1" />
          </TouchableOpacity>
        </View>

        {/* Right action group: Get Pro, Leaderboard, Streak */}
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            onPress={onPressUpgrade}
            style={styles.getProBtn}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Get Pro"
          >
            <Text style={styles.getProCrown}>👑</Text>
            <Text style={styles.getProText}>Get Pro</Text>
          </TouchableOpacity>

          {/* Leaderboard Podium Icon */}
          <TouchableOpacity
            onPress={onPressLeaderboard}
            style={styles.leaderboardBtn}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Leaderboard"
          >
            <View style={styles.podiumIconRow}>
              <View style={[styles.podiumCol, styles.podiumCol2]}>
                <Text style={styles.podiumNum}>2</Text>
              </View>
              <View style={[styles.podiumCol, styles.podiumCol1]}>
                <Text style={styles.podiumNum}>1</Text>
              </View>
              <View style={[styles.podiumCol, styles.podiumCol3]}>
                <Text style={styles.podiumNum}>3</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Daily Streak Flame */}
          <TouchableOpacity
            onPress={onPressStreak}
            style={styles.streakBadge}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Streak ${streakCount}`}
          >
            <Text style={styles.streakFlame}>🔥</Text>
            <Text style={styles.streakNumber}>{streakCount}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ================= 3 TOP TABS: Practice, Friends, Progress ================= */}
      <View style={styles.topTabBar}>
        <TouchableOpacity
          onPress={() => setActiveTopTab('practice')}
          style={[styles.topTabItem, activeTopTab === 'practice' && styles.topTabItemActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.topTabLabel, activeTopTab === 'practice' && styles.topTabLabelActive]}>
            Practice
          </Text>
          {activeTopTab === 'practice' && <View style={styles.topTabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTopTab('friends');
            if (onRefreshFriends) onRefreshFriends();
          }}
          style={[styles.topTabItem, activeTopTab === 'friends' && styles.topTabItemActive]}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={[styles.topTabLabel, activeTopTab === 'friends' && styles.topTabLabelActive]}>
              Friends
            </Text>
            {uniquePendingRequests.length > 0 && (
              <View style={styles.friendReqDot}>
                <Text style={styles.friendReqDotText}>{uniquePendingRequests.length}</Text>
              </View>
            )}
          </View>
          {activeTopTab === 'friends' && <View style={styles.topTabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTopTab('progress')}
          style={[styles.topTabItem, activeTopTab === 'progress' && styles.topTabItemActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.topTabLabel, activeTopTab === 'progress' && styles.topTabLabelActive]}>
            Progress
          </Text>
          {activeTopTab === 'progress' && <View style={styles.topTabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* ================= TAB 1: PRACTICE VIEW (IMAGE 5) ================= */}
      {activeTopTab === 'practice' && (
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.practiceContentScroll}
            showsVerticalScrollIndicator
            persistentScrollbar
          >
            <Text style={styles.guidelinesTitle}>🌟 Practice Guidelines</Text>
            <View style={styles.guidelinesList}>
              {PRACTICE_GUIDELINES.map((guideline) => (
                <View key={guideline.title} style={styles.guidelineItem}>
                  <View style={[styles.guidelineIconCircle, { backgroundColor: guideline.color }]}>
                    <Text style={styles.guidelineEmoji}>{guideline.icon}</Text>
                  </View>
                  <Text style={styles.guidelineText}>
                    <Text style={styles.guidelineItemTitle}>{guideline.title}: </Text>
                    {guideline.text}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* ================= BOTTOM ACTION SHEET CARD (IMAGE 5) ================= */}
          {bottomCardMinimized ? (
            <View style={styles.minimizedBottomCard}>
              <View style={styles.minimizedCardText}>
                <Text style={styles.minimizedCardTitle} numberOfLines={1}>
                  Daily free voice limit
                </Text>
                <Text style={styles.minimizedCardSubtitle} numberOfLines={1}>
                  {isSubscribed ? 'Unlimited' : dailyLimitReached ? `Limit reached · ${cooldownDisplay}` : `${timerDisplay} left`}
                  {' · '}{connectedCallsCount} connected {connectedCallsCount === 1 ? 'call' : 'calls'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setBottomCardMinimized(false)}
                style={styles.sheetToggleButton}
                accessibilityRole="button"
                accessibilityLabel="Expand call panel"
              >
                <Ionicons name="chevron-up" size={22} color="#334155" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.bottomCardSheet}>
              <View style={styles.freeCallingHeaderRow}>
                <Text style={styles.freeCallingTitle}>
                  Daily free voice limit: 10 minutes
                </Text>
                <View style={styles.bottomCardHeaderActions}>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        '10 Minutes Free Everyday! 🎁',
                        'Every user receives 10 minutes of free voice practice every single day! It automatically resets every day at midnight. Upgrade to PRO for unlimited 24/7 speaking practice and exclusive Male/Female filters.'
                      )
                    }
                    style={styles.infoIconBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Free calling info"
                  >
                    <Ionicons name="information-circle-outline" size={20} color="#64748B" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setBottomCardMinimized(true)}
                    style={styles.sheetToggleButton}
                    accessibilityRole="button"
                    accessibilityLabel="Minimize call panel"
                  >
                    <Ionicons name="chevron-down" size={22} color="#334155" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Progress Bar & Clock Timer */}
              <View style={styles.progressRow}>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.round(progressRatio * 100)}%`,
                        backgroundColor: isSubscribed ? '#10B981' : (progressRatio >= 1 ? '#EF4444' : '#6366F1'),
                      },
                    ]}
                  />
                </View>
                <View style={styles.timerClockBox}>
                  <Ionicons name="time-outline" size={17} color="#64748B" />
                  <Text style={styles.timerText}>
                    {isSubscribed ? 'Unlimited' : `${timerDisplay} left`}
                  </Text>
                </View>
              </View>
              <View style={styles.connectedCallsRow}>
                <Ionicons name="call-outline" size={15} color="#64748B" />
                <Text style={styles.connectedCallsText}>
                  Connected calls (last 24h): {connectedCallsCount}
                </Text>
              </View>
              {dailyLimitReached && (
                <View style={styles.dailyLimitReachedMessage}>
                  <Text style={styles.dailyLimitReachedText}>
                    Your daily limit is reached. Free calls available in {cooldownDisplay}.
                  </Text>
                  <TouchableOpacity
                    onPress={onPressUpgrade}
                    style={styles.upgradeAfterLimitButton}
                    accessibilityRole="button"
                    accessibilityLabel="Upgrade to PRO to continue now"
                  >
                    <Text style={styles.upgradeAfterLimitText}>Upgrade to PRO to continue now</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Gender Selector Label */}
              <Text style={styles.selectGenderLabel}>Select Co-learner's gender</Text>

              {/* 3 Gender Pill Buttons: Male 👑 | Female 👑 | Any */}
              <View style={styles.genderPillsRow}>
                <TouchableOpacity
                  onPress={() => handleSelectGender('male')}
                  style={[
                    styles.genderPill,
                    selectedGender === 'male' && styles.genderPillActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.genderPillText,
                      selectedGender === 'male' && styles.genderPillTextActive,
                    ]}
                  >
                    Male 👑
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSelectGender('female')}
                  style={[
                    styles.genderPill,
                    selectedGender === 'female' && styles.genderPillActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.genderPillText,
                      selectedGender === 'female' && styles.genderPillTextActive,
                    ]}
                  >
                    Female 👑
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSelectGender('any')}
                  style={[
                    styles.genderPill,
                    selectedGender === 'any' && styles.genderPillActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.genderPillText,
                      selectedGender === 'any' && styles.genderPillTextActive,
                    ]}
                  >
                    Any
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Start a random speaking call */}
              <TouchableOpacity
                onPress={handleStartTalk}
                disabled={isMatching || dailyLimitReached}
                style={[
                  styles.startCallBtn,
                  (isMatching || dailyLimitReached) && { opacity: 0.7 },
                ]}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel={dailyLimitReached ? 'Daily limit reached' : 'Connect to a learner'}
              >
                <Ionicons name="call" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.startCallBtnText}>
                  {dailyLimitReached ? 'Daily limit reached' : isMatching ? 'Connecting...' : 'Connect to a learner'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: '#64748B', fontSize: 12, marginTop: 8 }}>
              Choose a gender, then tap Try your 1st Call to start matching.
            </Text>

            {/* Big CTA Button: Try your 1st Call */}
            <TouchableOpacity
              onPress={handleStartTalk}
              disabled={isMatching}
              style={[
                styles.tryCallBtn,
                isMatching && { opacity: 0.7 },
              ]}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Try your 1st Call"
            >
              <Ionicons name="call" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.tryCallBtnText}>Try your 1st Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ================= TAB 2: FRIENDS VIEW ================= */}
      {activeTopTab === 'friends' && (
        <ScrollView
          contentContainerStyle={styles.friendsContentScroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={friendsRefreshing}
              onRefresh={handleRefreshFriends}
              tintColor="#6366F1"
              colors={['#6366F1']}
            />
          }
        >
          {/* Search bar */}
          <View style={styles.searchFriendsBar}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              value={searchFriendText}
              onChangeText={setSearchFriendText}
              placeholder="Search co-learners & friends..."
              placeholderTextColor="#94A3B8"
              style={styles.searchFriendInput}
            />
            {searchFriendText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchFriendText('')}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Pending Friend Requests */}
          {uniquePendingRequests.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={styles.sectionHeading}>Pending Friend Requests 📬</Text>
                <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>{uniquePendingRequests.length} new</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>
                These co-learners want to connect with you. Accept to start practicing and chatting!
              </Text>
              {uniquePendingRequests.map((req) => (
                <View key={req.id || req._id || req.requestId || (req.from?.name || Math.random())} style={styles.friendReqRow}>
                  <Image
                    source={{
                      uri: req.from?.avatarUrl || req.from?.profilePhotoUrl || 'https://api.dicebear.com/7.x/avataaars/png?seed=' + encodeURIComponent(req.from?.displayName || req.from?.name || 'Friend'),
                    }}
                    style={styles.friendAvatar}
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.friendName}>{req.from?.displayName || req.from?.name || 'Co-learner'}</Text>
                    <Text style={styles.friendSub}>{req.from?.country ? `${req.from.country} · ` : ''}Wants to practice English with you</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => onAcceptFriendRequest && onAcceptFriendRequest(req)}
                      style={styles.acceptBtn}
                    >
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onDeclineFriendRequest && onDeclineFriendRequest(req)}
                      style={styles.declineBtn}
                    >
                      <Ionicons name="close" size={16} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Searched Co-learners (when user types in search bar) */}
          {searchLower.length > 0 && searchedCoLearners.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>Search Results 🔍</Text>
              <Text style={styles.sectionSub}>Registered co-learners matching "{searchFriendText}":</Text>
              {searchedCoLearners.map((learner) => {
                const uid = learner.id || learner._id || learner.name || learner.displayName;
                const isSent = Boolean(
                  sentMap[uid] ||
                  uniqueSentRequests.some((s) => String(s.to?.id) === String(learner.id) || s.to?.name?.toLowerCase() === learner.name?.toLowerCase())
                );
                return (
                  <View key={uid} style={styles.recentLearnerRow}>
                    <Image
                      source={{
                        uri: learner.profilePhotoUrl || 'https://api.dicebear.com/7.x/avataaars/png?seed=' + encodeURIComponent(learner.displayName || learner.name),
                      }}
                      style={styles.friendAvatar}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.friendName}>{learner.displayName || learner.name}</Text>
                      <Text style={styles.friendSub}>{learner.country || 'Global'} • {learner.level || 'Co-learner'}</Text>
                    </View>
                    {renderActionForLearner(learner)}
                  </View>
                );
              })}
            </View>
          )}

          {/* Outgoing Friend Requests Sent (Pending co-learner acceptance) */}
          {uniqueSentRequests.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Friend Requests Sent 📤</Text>
                <Text style={styles.friendCountBadge}>{uniqueSentRequests.length} pending</Text>
              </View>
              <Text style={styles.sectionSub}>Waiting for your co-learner to accept:</Text>
              {uniqueSentRequests.map((req) => (
                <View key={req.id || req._id || req.requestId || (req.to?.name || Math.random())} style={styles.friendReqRow}>
                  <Image
                    source={{
                      uri: req.to?.profilePhotoUrl || 'https://api.dicebear.com/7.x/avataaars/png?seed=' + encodeURIComponent(req.to?.name || 'Co-learner'),
                    }}
                    style={styles.friendAvatar}
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.friendName}>{req.to?.displayName || req.to?.name || 'Co-learner'}</Text>
                    <Text style={styles.friendSub}>Request Sent • Waiting for acceptance ⏳</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => onCancelFriendRequest && onCancelFriendRequest(req)}
                    style={styles.declineBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700' }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Connected Practice Friends List */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>My Practice Friends</Text>
              <Text style={styles.friendCountBadge}>{filteredFriends.length} friends</Text>
            </View>

            {!isSubscribed && filteredFriends.length > 0 && (
              <View style={styles.proFriendsBanner}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.proFriendsBannerTitle}>👑 Direct Calls & Chat with Friends</Text>
                  <Text style={styles.proFriendsBannerSub}>Upgrade to BYTALK PRO to call & chat with your friends directly anytime.</Text>
                </View>
                <TouchableOpacity
                  onPress={onPressUpgrade}
                  style={styles.proFriendsUpgradeBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.proFriendsUpgradeBtnText}>Upgrade</Text>
                </TouchableOpacity>
              </View>
            )}

            {filteredFriends.length === 0 ? (
              <View style={styles.emptyFriendsBox}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>🤝</Text>
                <Text style={styles.emptyFriendsTitle}>No friends connected yet</Text>
                <Text style={styles.emptyFriendsSub}>
                  Practice calls with co-learners on the Practice tab, send them a friend request, and call each other directly anytime!
                </Text>
                <TouchableOpacity
                  onPress={() => setActiveTopTab('practice')}
                  style={styles.goToPracticeBtn}
                >
                  <Text style={styles.goToPracticeBtnText}>Start Speaking Practice</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredFriends.map((f) => (
                <View key={f.id || f.name} style={styles.friendRow}>
                  <View style={{ position: 'relative' }}>
                    <Image
                      source={{
                        uri: f.profilePhotoUrl || 'https://api.dicebear.com/7.x/avataaars/png?seed=' + f.name,
                      }}
                      style={styles.friendAvatar}
                    />
                    <View style={styles.onlineStatusDot} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={styles.friendName}>{f.name}</Text>
                      {f.isPro && <Text style={{ fontSize: 13 }}>👑</Text>}
                    </View>
                    <Text style={styles.friendSub}>
                      {f.country || 'Global'} • {f.level || 'Intermediate'}
                    </Text>
                    {pendingFriendRemoval === String(f.id || f._id || f.name || '') ? (
                      <View style={styles.removeFriendConfirm}>
                        <Text style={styles.removeFriendConfirmText}>Remove friend?</Text>
                        <TouchableOpacity
                          onPress={() => setPendingFriendRemoval(null)}
                          style={styles.removeFriendCancelBtn}
                          activeOpacity={0.8}
                          accessibilityRole="button"
                          accessibilityLabel="Cancel removing friend"
                        >
                          <Text style={styles.removeFriendCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            setPendingFriendRemoval(null);
                            onRemoveFriend && onRemoveFriend(f);
                          }}
                          style={styles.removeFriendConfirmBtn}
                          activeOpacity={0.8}
                          accessibilityRole="button"
                          accessibilityLabel={`Confirm removing ${f.name || 'friend'}`}
                        >
                          <Text style={styles.removeFriendConfirmBtnText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => confirmRemoveFriend(f)}
                        style={styles.removeFriendAction}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${f.name || 'friend'} from friends`}
                      >
                        <Ionicons name="person-remove-outline" size={13} color="#B91C1C" />
                        <Text style={styles.removeFriendActionText}>Remove friend</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {/* Actions for Accepted Friend: Chat, Video Call, Voice Call */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => onDirectChat && onDirectChat(f)}
                      style={styles.directChatBtn}
                      activeOpacity={0.8}
                      accessibilityLabel={`Chat with ${f.name}`}
                    >
                      <Ionicons name="chatbubble-ellipses" size={14} color="#6366F1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => onDirectVideoCall && onDirectVideoCall(f)}
                      style={styles.directVideoBtn}
                      activeOpacity={0.8}
                      accessibilityLabel={`Video call ${f.name}`}
                    >
                      <Ionicons name="videocam" size={14} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => onDirectCall && onDirectCall(f)}
                      style={styles.directCallBtn}
                      activeOpacity={0.8}
                      accessibilityLabel={`Voice call ${f.name}`}
                    >
                      <Ionicons name="call" size={13} color="#FFFFFF" style={{ marginRight: 3 }} />
                      <Text style={styles.directCallBtnText}>Call</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Recent Co-Learners Section */}
          {uniqueRecentCoLearners.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>Recent Co-learners</Text>
              <Text style={styles.sectionSub}>Add people you recently practiced with:</Text>
              {uniqueRecentCoLearners.map((learner) => {
                const uid = learner.id || learner._id || learner.name || learner.displayName;
                const isSent = Boolean(
                  sentMap[uid] ||
                  uniqueSentRequests.some((s) => String(s.to?.id) === String(learner.id) || s.to?.name?.toLowerCase() === learner.name?.toLowerCase())
                );
                return (
                  <View key={uid} style={styles.recentLearnerRow}>
                    <Image
                      source={{
                        uri: learner.profilePhotoUrl || 'https://api.dicebear.com/7.x/avataaars/png?seed=' + encodeURIComponent(learner.displayName || learner.name),
                      }}
                      style={styles.friendAvatar}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.friendName}>{learner.displayName || learner.name}</Text>
                      <Text style={styles.friendSub}>{learner.country || 'Global'} • Co-learner</Text>
                    </View>
                    {renderActionForLearner(learner)}
                  </View>
                );
              })}
            </View>
          )}

          {/* Suggested Co-learners when 0 friends */}
          {uniqueFriends.length === 0 && (allPartners || []).length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>Suggested Co-learners 🌍</Text>
              <Text style={styles.sectionSub}>Send a friend request to start practicing together:</Text>
              {(allPartners || []).slice(0, 5).map((learner) => {
                const uid = learner.id || learner._id || learner.name || learner.displayName;
                const isSent = Boolean(
                  sentMap[uid] ||
                  uniqueSentRequests.some((s) => String(s.to?.id) === String(learner.id) || s.to?.name?.toLowerCase() === learner.name?.toLowerCase())
                );
                return (
                  <View key={uid} style={styles.recentLearnerRow}>
                    <Image
                      source={{
                        uri: learner.profilePhotoUrl || 'https://api.dicebear.com/7.x/avataaars/png?seed=' + encodeURIComponent(learner.displayName || learner.name),
                      }}
                      style={styles.friendAvatar}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.friendName}>{learner.displayName || learner.name}</Text>
                      <Text style={styles.friendSub}>{learner.country || 'Global'} • {learner.level || 'Intermediate'}</Text>
                    </View>
                    {renderActionForLearner(learner)}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* ================= TAB 3: PROGRESS VIEW ================= */}
      {activeTopTab === 'progress' && (
        <ScrollView
          contentContainerStyle={styles.progressContentScroll}
          showsVerticalScrollIndicator
          persistentScrollbar
        >
          {/* Daily 10 Min Free Practice Status Card */}
          <View style={styles.progressStatCard}>
            <View style={styles.progressStatHeader}>
              <View>
                <Text style={styles.progressCardTitle}>Daily Free Speaking Time</Text>
                <Text style={styles.progressCardSub}>After reaching the limit, free calls unlock 24 hours later.</Text>
              </View>
              <View style={styles.progressLimitBadge}>
                <Text style={styles.progressLimitText}>10 Min Daily</Text>
              </View>
            </View>

            <View style={styles.progressMetricBig}>
              <Text style={styles.progressMetricBigNum}>
                {isSubscribed ? 'Unlimited' : dailyLimitReached ? 'Limit reached' : `${remMinutes}m ${remSeconds}s`}
              </Text>
              <Text style={styles.progressMetricBigLabel}>
                {isSubscribed
                  ? 'speaking time'
                  : dailyLimitReached
                    ? `Free calls available in ${cooldownDisplay}`
                    : 'remaining'}
              </Text>
            </View>

            <View style={[styles.progressBarTrack, { height: 10, marginTop: 12 }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.round(progressRatio * 100)}%`,
                    backgroundColor: isSubscribed ? '#10B981' : (dailyLimitReached ? '#EF4444' : '#6366F1'),
                  },
                ]}
              />
            </View>
            {dailyLimitReached && (
              <TouchableOpacity
                onPress={onPressUpgrade}
                style={styles.upgradeAfterLimitButton}
                accessibilityRole="button"
                accessibilityLabel="Upgrade to PRO to continue now"
              >
                <Text style={styles.upgradeAfterLimitText}>Upgrade to PRO to continue now</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Daily Streak Card */}
          <View style={styles.progressStatCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 34 }}>🔥</Text>
              <View>
                <Text style={styles.progressCardTitle}>{streakCount} Days Streak</Text>
                <Text style={styles.progressCardSub}>Practice daily to build fluency and confidence</Text>
              </View>
            </View>
          </View>

          {/* Stats Grid: Calls, Speaking Mins, Co-learner Rating */}
          <View style={styles.statsTwoColRow}>
            <View style={styles.statMiniCard}>
              <Text style={styles.statMiniNum}>
                {ratingsReceived > 0 && averageRating !== null ? `⭐ ${averageRating.toFixed(1)}` : '—'}
              </Text>
              <Text style={styles.statMiniLabel}>Co-learner Rating</Text>
              <Text style={styles.progressCardSub}>
                {progressStats ? `${ratingsReceived} ratings received` : 'Ratings received'}
              </Text>
            </View>
            <View style={styles.statMiniCard}>
              <Text style={styles.statMiniNum}>{completedCallsCount ?? '—'}</Text>
              <Text style={styles.statMiniLabel}>Calls Completed</Text>
            </View>
          </View>
          {progressError ? (
            <Text style={styles.progressDataError}>
              Could not load live progress: {progressError}
            </Text>
          ) : null}

          <View style={styles.progressStatCard}>
            <Text style={styles.progressCardTitle}>Co-learner Badges Earned</Text>
            {earnedBadges.length > 0 ? (
              <View style={styles.badgesRow}>
                {earnedBadges.map((badge) => (
                  <View key={badge.title} style={styles.badgeItem}>
                    <Text style={{ fontSize: 24, marginBottom: 4 }}>{badge.icon}</Text>
                    <Text style={styles.badgeLabel}>{badge.title}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.progressCardSub}>
                {progressStats
                  ? 'No badges earned yet. Keep practicing and collect co-learner feedback.'
                  : progressError || 'Loading your real progress…'}
              </Text>
            )}
          </View>
        </ScrollView>
      )}

      {/* ================= RADAR MATCHING OVERLAY (EXACT MATCH TO IMAGE 4) ================= */}
      {isMatching && (
        <View style={styles.matchingOverlay}>
          {/* Header Title & Subtitle */}
          <View style={styles.matchingTopArea}>
            <Text style={styles.matchingTitle}>
              Finding a <Text style={styles.matchingTitlePurple}>Random</Text> Co-learner For You
            </Text>
            <Text style={styles.matchingSubtitle}>Hang on, Good things take time</Text>
          </View>

          {/* Radar Circles with User Avatar */}
          <View style={styles.radarCenterArea}>
            {/* Outer Ripple Circle 3 */}
            <Animated.View
              style={[
                styles.radarCircleOuter,
                { transform: [{ scale: pulseAnim3 }] },
              ]}
            />
            {/* Middle Ripple Circle 2 */}
            <Animated.View
              style={[
                styles.radarCircleMid,
                { transform: [{ scale: pulseAnim2 }] },
              ]}
            />
            {/* Inner Circle 1 */}
            <Animated.View
              style={[
                styles.radarCircleInner,
                { transform: [{ scale: pulseAnim1 }] },
              ]}
            >
              <Image source={{ uri: userAvatar }} style={styles.radarAvatarImg} />
            </Animated.View>

            {/* Orbiting Magnifying Glasses */}
            <View style={[styles.magnifierIcon, { top: 20, right: 70 }]}>
              <Ionicons name="search" size={20} color="#1E293B" />
            </View>
            <View style={[styles.magnifierIcon, { bottom: 60, left: 45 }]}>
              <Ionicons name="search" size={20} color="#1E293B" />
            </View>
            <View style={[styles.magnifierIcon, { top: 120, right: 30 }]}>
              <Ionicons name="search" size={20} color="#1E293B" />
            </View>
            <View style={[styles.magnifierIcon, { bottom: 30, right: 80 }]}>
              <Ionicons name="search" size={20} color="#1E293B" />
            </View>
          </View>

          {/* App Rating Callout Banner (Light Green Box) */}
          <View style={styles.matchingGreenBanner}>
            <Text style={styles.matchingGreenText}>
              BYTALK App is the highest rated app on playstore for English speaking. 🤩
            </Text>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={onCancelMatch}
            style={styles.matchingCancelBtn}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Cancel matching"
          >
            <Text style={styles.matchingCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },

  /* ================= TOP HEADER (IMAGE 5) ================= */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  userProfileWrapper: {
    position: 'relative',
  },
  userAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E7FF',
  },
  menuBadgeCircle: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  getProBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    borderWidth: 1.2,
    borderColor: '#FACC15',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 18,
    gap: 4,
  },
  getProCrown: {
    fontSize: 13,
  },
  getProText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#A16207',
  },
  leaderboardBtn: {
    padding: 4,
  },
  podiumIconRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 24,
    gap: 2,
  },
  podiumCol: {
    width: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  podiumCol1: {
    height: 22,
    backgroundColor: '#F59E0B',
  },
  podiumCol2: {
    height: 16,
    backgroundColor: '#3B82F6',
  },
  podiumCol3: {
    height: 13,
    backgroundColor: '#8B5CF6',
  },
  podiumNum: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 3,
  },
  streakFlame: {
    fontSize: 14,
  },
  streakNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },

  /* ================= 3 TOP TABS ================= */
  topTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
    paddingHorizontal: 10,
  },
  topTabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  topTabItemActive: {
    borderBottomWidth: 0,
  },
  topTabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  topTabLabelActive: {
    color: '#6366F1',
    fontWeight: '800',
  },
  topTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: '#6366F1',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  friendReqDot: {
    backgroundColor: '#EF4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendReqDotText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },

  /* ================= PRACTICE TAB (IMAGE 5) ================= */
  practiceContentScroll: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 240,
  },
  guidelinesList: {
    gap: 16,
  },
  guidelinesTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 16,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  guidelineIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidelineEmoji: {
    fontSize: 20,
  },
  guidelineText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 19,
  },
  guidelineItemTitle: {
    fontWeight: '800',
  },

  /* ================= BOTTOM CARD SHEET (IMAGE 5) ================= */
  bottomCardSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  minimizedBottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  minimizedCardText: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  minimizedCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  minimizedCardSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  freeCallingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomCardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freeCallingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  infoIconBtn: {
    padding: 2,
  },
  sheetToggleButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  progressBarTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EEF2F6',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  timerClockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  connectedCallsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 9,
  },
  connectedCallsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  dailyLimitReachedMessage: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  dailyLimitReachedText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '700',
  },
  upgradeAfterLimitButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
  },
  upgradeAfterLimitText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  selectGenderLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 10,
  },
  genderPillsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  genderPillActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  genderPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  genderPillTextActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  startCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 26,
    paddingVertical: 14,
    marginTop: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  startCallBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  /* ================= FRIENDS TAB ================= */
  friendsContentScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  searchFriendsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    gap: 8,
  },
  searchFriendInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    padding: 0,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  proFriendsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF7F2',
    borderColor: '#FFD6C4',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  proFriendsBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF693D',
    marginBottom: 2,
  },
  proFriendsBannerSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  proFriendsUpgradeBtn: {
    backgroundColor: '#FF693D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  proFriendsUpgradeBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  friendCountBadge: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '700',
  },
  emptyFriendsBox: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  emptyFriendsTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  emptyFriendsSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  goToPracticeBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  goToPracticeBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E7FF',
  },
  onlineStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  friendName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  friendSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  directChatBtn: {
    padding: 7,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  directVideoBtn: {
    padding: 7,
    borderRadius: 16,
    backgroundColor: '#F97316',
  },
  directCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  directCallBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  removeFriendAction: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  removeFriendActionText: {
    color: '#B91C1C',
    fontSize: 11,
    fontWeight: '700',
  },
  removeFriendConfirm: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFF7F7',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  removeFriendConfirmText: {
    color: '#7F1D1D',
    fontSize: 10,
    fontWeight: '700',
  },
  removeFriendCancelBtn: {
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  removeFriendCancelText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '600',
  },
  removeFriendConfirmBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#B91C1C',
  },
  removeFriendConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  friendReqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  acceptBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  declineBtn: {
    backgroundColor: '#F1F5F9',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentLearnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  addFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  addFriendBtnSent: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  addFriendBtnText: {
    color: '#4F46E5',
    fontSize: 11.5,
    fontWeight: '700',
  },

  /* ================= PROGRESS TAB ================= */
  progressContentScroll: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  progressStatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  progressStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  progressCardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  progressDataError: {
    color: '#B91C1C',
    fontSize: 12,
    marginHorizontal: 2,
  },
  progressLimitBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  progressLimitText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '800',
  },
  progressMetricBig: {
    marginTop: 14,
  },
  progressMetricBigNum: {
    fontSize: 26,
    fontWeight: '900',
    color: '#6366F1',
  },
  progressMetricBigLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statsTwoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statMiniCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  statMiniNum: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  statMiniLabel: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
  },
  badgeItem: {
    alignItems: 'center',
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  /* ================= RADAR MATCHING OVERLAY (IMAGE 4) ================= */
  matchingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F7F6FE',
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 36,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    paddingHorizontal: 24,
  },
  matchingTopArea: {
    alignItems: 'center',
  },
  matchingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  matchingTitlePurple: {
    color: '#6366F1',
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  matchingSubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  radarCenterArea: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  radarCircleOuter: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: '#E0E7FF',
    opacity: 0.45,
  },
  radarCircleMid: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#C7D2FE',
    opacity: 0.6,
  },
  radarCircleInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 8,
  },
  radarAvatarImg: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  magnifierIcon: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchingGreenBanner: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
  },
  matchingGreenText: {
    color: '#15803D',
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  matchingCancelBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  matchingCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
});
