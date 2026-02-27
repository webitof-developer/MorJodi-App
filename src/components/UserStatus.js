import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

const UserStatus = ({ isOnline, lastActive, variant = 'default' }) => {
  const formatLastActive = date => {
    if (!date) return null;
    const now = new Date();
    const lastActiveDate = new Date(date);
    if (Number.isNaN(lastActiveDate.getTime())) return null;
    const diffSeconds = Math.floor((now - lastActiveDate) / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    return `${diffDays}d ago`;
  };
  const online = isOnline === true || String(isOnline).toLowerCase() === 'online';
  const lastSeenText = formatLastActive(lastActive);

  // ✅ Small Variant (for MessageScreen header)
  if (variant === 'small') {
    return (
      <View style={styles.smallContainer}>
        {online && <View style={styles.greenDot} />}
        <Text style={styles.smallText}>
          {online
            ? 'Online'
            : lastSeenText
              ? `Last seen ${lastSeenText}`
              : 'Offline'}
        </Text>
      </View>
    );
  }

  // ✅ Default Variant (for Profile / MatchCard)
  return (
    <View style={styles.container}>
      {online && <View style={styles.greenDot} />}
      <Text style={styles.defaultText}>
        {online
          ? 'Online'
          : lastSeenText
            ? `Offline (${lastSeenText})`
            : 'Offline'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // 🔹 Default (Profile / Card)
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  defaultText: {
    ...FONTS.body6,
    color: COLORS.white,
  },

  // 🔹 Green Dot (shown only if online)
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.green,
    marginRight: 5,
  },

  // 🔹 Small Variant (Header style)
  smallContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    // No background color for modern header look
  },
  smallText: {
    ...FONTS.body5, // Smaller font
    color: '#6b7280', // Cool gray
    fontSize: 13,
  },
});

export default UserStatus;
