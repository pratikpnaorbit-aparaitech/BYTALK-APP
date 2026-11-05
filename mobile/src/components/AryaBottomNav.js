import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function AryaBottomNav({
  activeTab,
  onTabPress,
  unreadCount = 0,
  isPro = false,
}) {
  const tabs = [
    { id: 'discover', label: 'Discover', icon: 'compass-outline', iconActive: 'compass' },
    { id: 'practice', label: 'Practice', icon: 'book-outline', iconActive: 'book' },
    { id: 'messages', label: 'Messages', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
    { id: 'profile', label: 'Profile', icon: 'stats-chart-outline', iconActive: 'stats-chart' },
  ];

  return (
    <View style={styles.navContainer}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
          || (tab.id === 'discover' && ['discover', 'home'].includes(activeTab))
          || (tab.id === 'practice' && ['practice', 'call', 'call-tab', 'learn'].includes(activeTab))
          || (tab.id === 'messages' && ['messages', 'chat'].includes(activeTab))
          || (tab.id === 'profile' && ['profile'].includes(activeTab));

        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onTabPress(tab.id)}
            style={styles.tabItem}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Navigate to ${tab.label}`}
          >
            {/* Active Pill indicator behind icon */}
            <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
              <Ionicons
                name={isActive ? tab.iconActive : tab.icon}
                size={22}
                color={isActive ? '#FF5A36' : '#8E8E93'}
              />
            </View>

            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>

            {/* Unread badge on messages */}
            {tab.id === 'messages' && unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECEEF5',
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 20 : 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    position: 'relative',
  },
  iconWrapper: {
    width: 44,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconWrapperActive: {
    backgroundColor: 'transparent',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabLabelActive: {
    fontWeight: '700',
    color: '#FF5A36',
  },
  unreadBadge: {
    position: 'absolute',
    top: 2,
    right: 14,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
