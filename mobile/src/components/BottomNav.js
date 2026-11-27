import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function BottomNav({
  activeTab,
  onTabPress,
  unreadCount = 0,
  isPro = false,
}) {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
    { id: 'learn', label: 'Learn', icon: 'book-outline', iconActive: 'book' },
    { id: 'pro', label: isPro ? 'PRO 👑' : 'Get Pro', icon: 'crown', iconActive: 'crown' },
    { id: 'call', label: 'Call', icon: 'call-outline', iconActive: 'call' },
    { id: 'discover', label: 'Discover', icon: 'compass-outline', iconActive: 'compass' },
  ];

  return (
    <View style={styles.navContainer}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
          || (tab.id === 'home' && ['home'].includes(activeTab))
          || (tab.id === 'learn' && ['learn'].includes(activeTab))
          || (tab.id === 'pro' && ['premium', 'pro'].includes(activeTab))
          || (tab.id === 'call' && ['call', 'call-tab', 'practice'].includes(activeTab))
          || (tab.id === 'discover' && ['discover', 'messages', 'chat'].includes(activeTab));

        const isCallTab = tab.id === 'call';

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
            <View
              style={[
                styles.iconWrapper,
                isActive && isCallTab && styles.callIconWrapperActive,
                isActive && !isCallTab && styles.iconWrapperActive,
              ]}
            >
              {tab.id === 'pro' ? (
                <MaterialCommunityIcons
                  name="crown"
                  size={22}
                  color={isActive ? '#F59E0B' : '#737F96'}
                />
              ) : (
                <Ionicons
                  name={isActive ? tab.iconActive : tab.icon}
                  size={21}
                  color={
                    isActive
                      ? (isCallTab ? '#6366F1' : '#6366F1')
                      : '#737F96'
                  }
                />
              )}
            </View>

            <Text
              style={[
                styles.tabLabel,
                isActive && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>

            {/* Unread badge on discover / messages */}
            {tab.id === 'discover' && unreadCount > 0 && (
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
    width: 48,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconWrapperActive: {
    backgroundColor: 'transparent',
  },
  callIconWrapperActive: {
    backgroundColor: '#EEF2FF',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#737F96',
  },
  tabLabelActive: {
    fontWeight: '700',
    color: '#6366F1',
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
