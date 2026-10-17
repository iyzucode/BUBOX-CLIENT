import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useProfilePalette } from './profilePalette';
import { ChevronRight } from './ProfileIcons';

export interface ProfileMenuItemProps {
  id: string;
  label: string;
  icon: (color: string) => React.ReactNode;
  rightElement?: React.ReactNode;
  onPress?: () => void;
}

interface ProfileMenuGroupProps {
  items: ProfileMenuItemProps[];
}

export const ProfileMenuGroup: React.FC<ProfileMenuGroupProps> = ({ items }) => {
  const palette = useProfilePalette();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.cardBg,
          borderColor: palette.cardBorder,
        },
      ]}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        const content = (
          <View
            style={[
              styles.row,
              !isLast && {
                borderBottomWidth: 1,
                borderBottomColor: palette.divider,
              },
            ]}
          >
            {/* Left Icon + Label */}
            <View style={styles.left}>
              <View style={styles.iconWrapper}>
                {item.icon(palette.menuIconColor)}
              </View>
              <ThemedText
                style={[styles.label, { color: palette.menuTextColor }]}
              >
                {item.label}
              </ThemedText>
            </View>

            {/* Right Action / Chevron */}
            <View style={styles.right}>
              {item.rightElement ? (
                item.rightElement
              ) : (
                <ChevronRight size={18} color={palette.chevronColor} />
              )}
            </View>
          </View>
        );

        if (item.onPress) {
          return (
            <Pressable
              key={item.id}
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.itemPressable,
                pressed && { backgroundColor: palette.menuItemHover },
              ]}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              {content}
            </Pressable>
          );
        }

        // Static or contains internal interactive component (like Switch)
        return (
          <View key={item.id} style={styles.itemStatic}>
            {content}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemPressable: {
    width: '100%',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  itemStatic: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrapper: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});
