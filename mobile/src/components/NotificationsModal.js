import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsModal({
  visible,
  onClose,
  pendingRequests = [],
  sentRequests = [],
  recentNotifications = [],
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
  onStartChat,
  onGoToDiscover,
}) {
  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent'

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="notifications" size={22} color="#5843E8" />
              <Text style={styles.modalTitle}>Notifications & Requests</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              activeOpacity={0.7}
              accessibilityLabel="Close notifications modal"
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Tab switch */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'received' && styles.tabItemActive]}
              onPress={() => setActiveTab('received')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'received' && styles.tabTextActive]}>
                Received ({pendingRequests.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'sent' && styles.tabItemActive]}
              onPress={() => setActiveTab('sent')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'sent' && styles.tabTextActive]}>
                Sent ({sentRequests.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {activeTab === 'received' ? (
              pendingRequests.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="people-outline" size={32} color="#94A3B8" />
                  </View>
                  <Text style={styles.emptyTitle}>No Pending Requests</Text>
                  <Text style={styles.emptySubtitle}>
                    When someone sends you a friend request from Discover or after a call, it will appear here.
                  </Text>
                  {onGoToDiscover && (
                    <TouchableOpacity
                      onPress={() => {
                        onClose();
                        onGoToDiscover();
                      }}
                      style={styles.discoverActionBtn}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="compass-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.discoverActionBtnText}>Find Partners in Discover</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                pendingRequests.map((req) => {
                  const user = req.from || {};
                  const userName = user.displayName || user.name || 'Co-learner';
                  return (
                    <View key={req.id || user.id} style={styles.requestCard}>
                      <View style={styles.userRow}>
                        <View style={styles.avatarCircle}>
                          {user.avatarUrl || user.profilePhotoUrl ? (
                            <Image
                              source={{ uri: user.avatarUrl || user.profilePhotoUrl }}
                              style={styles.avatarImage}
                            />
                          ) : (
                            <Text style={styles.avatarText}>
                              {userName.trim().charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.userName}>{userName}</Text>
                          <Text style={styles.userMeta}>
                            {user.country ? `${user.country} · ` : ''}{user.level || 'Beginner'}
                          </Text>
                          <Text style={styles.requestReason}>
                            Sent you a friend request to practice English together!
                          </Text>
                        </View>
                      </View>

                      {/* Action buttons */}
                      <View style={styles.actionButtonsRow}>
                        <TouchableOpacity
                          style={styles.acceptButton}
                          onPress={() => onAcceptRequest && onAcceptRequest(req)}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="checkmark-sharp" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.acceptButtonText}>Accept</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.declineButton}
                          onPress={() => onDeclineRequest && onDeclineRequest(req)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.declineButtonText}>Decline</Text>
                        </TouchableOpacity>

                        {onStartChat && (
                          <TouchableOpacity
                            style={styles.chatPreviewButton}
                            onPress={() => {
                              onClose();
                              onStartChat(user);
                            }}
                            activeOpacity={0.85}
                          >
                            <Ionicons name="chatbubble-outline" size={15} color="#5843E8" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )
            ) : sentRequests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="paper-plane-outline" size={30} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTitle}>No Sent Requests</Text>
                <Text style={styles.emptySubtitle}>
                  You haven't sent any friend requests yet. Tap "Add Friend" on co-learners to connect!
                </Text>
              </View>
            ) : (
              sentRequests.map((req) => {
                const user = req.to || {};
                const userName = user.displayName || user.name || 'Co-learner';
                return (
                  <View key={req.id || user.id} style={styles.requestCard}>
                    <View style={styles.userRow}>
                      <View style={styles.avatarCircle}>
                        {user.avatarUrl || user.profilePhotoUrl ? (
                          <Image
                            source={{ uri: user.avatarUrl || user.profilePhotoUrl }}
                            style={styles.avatarImage}
                          />
                        ) : (
                          <Text style={styles.avatarText}>
                            {userName.trim().charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.userName}>{userName}</Text>
                        <Text style={styles.userMeta}>
                          {user.country ? `${user.country} · ` : ''}{user.level || 'Beginner'}
                        </Text>
                        <Text style={[styles.requestReason, { color: '#D97706' }]}>
                          Pending response...
                        </Text>
                      </View>
                      {onCancelRequest && (
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => onCancelRequest(req)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '45%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 10,
  },
  tabItem: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
  },
  tabItemActive: {
    backgroundColor: '#EEF2FF',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  discoverActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5843E8',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  discoverActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 46,
    height: 46,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E11D48',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  userMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  requestReason: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
    marginTop: 3,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 9,
    borderRadius: 12,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  declineButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  declineButtonText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  chatPreviewButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
});
