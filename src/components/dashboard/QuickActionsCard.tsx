import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export interface QuickActionButtonItem {
  id: string;
  label: string;
  badge?: string | number;
  onPress?: () => void;
}

interface QuickActionsCardProps {
  buttons?: QuickActionButtonItem[];
  onActionPress?: (buttonId: string) => void;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  buttons,
  onActionPress,
}) => {
  const theme = useTheme();

  const defaultButtons: QuickActionButtonItem[] = [
    {
      id: 'button-1',
      label: 'Pesan Menu',
    },
    {
      id: 'button-2',
      label: 'Button 2',
      badge: '7',
    },
    {
      id: 'button-3',
      label: 'Button 3',
    },
    {
      id: 'button-4',
      label: 'Button 4',
    },
  ];

  const items = buttons || defaultButtons;

  const renderIcon = (index: number) => {
    const tealColor = theme.secondary || '#005B64';

    if (Platform.OS === 'web') {
      if (index === 0) {
        // Icon 1: Clipboard/Folder with orange plus badge
        return (
          <View style={styles.iconWrapper}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={tealColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="16" x2="13" y2="16" />
            </svg>
            <View style={[styles.miniPlusBadge, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.plusText}>+</ThemedText>
            </View>
          </View>
        );
      }
      if (index === 1) {
        // Icon 2: Coin/Hand with red counter badge
        return (
          <View style={styles.iconWrapper}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={tealColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
              <path d="M7 11.5a3 3 0 1 1 5.9-1" />
              <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
            </svg>
          </View>
        );
      }
      if (index === 2) {
        // Icon 3: Report & chart
        return (
          <View style={styles.iconWrapper}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={tealColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="8" y1="18" x2="8" y2="15" />
              <line x1="16" y1="18" x2="16" y2="10" />
            </svg>
          </View>
        );
      }
      // Icon 4: Book / Knowledge
      return (
        <View style={styles.iconWrapper}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={tealColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <line x1="9" y1="7" x2="15" y2="7" />
            <line x1="9" y1="11" x2="13" y2="11" />
          </svg>
        </View>
      );
    }

    return (
      <ThemedText style={{ fontSize: 24 }}>
        {index === 0 ? '📋' : index === 1 ? '🤝' : index === 2 ? '📊' : '📖'}
      </ThemedText>
    );
  };

  return (
    <View style={styles.floatingCardWrapper}>
      <View
        style={[
          styles.cardContainer,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.buttonsGrid}>
          {items.map((btn, index) => {
            return (
              <Pressable
                key={btn.id}
                onPress={() => {
                  if (btn.onPress) {
                    btn.onPress();
                  } else if (onActionPress) {
                    onActionPress(btn.id);
                  }
                }}
                style={({ pressed }) => [
                  styles.buttonItem,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={btn.label}
              >
                <View style={styles.iconOuter}>
                  <View
                    style={[
                      styles.circleIconBg,
                      { backgroundColor: theme.backgroundElement },
                    ]}
                  >
                    {renderIcon(index)}
                  </View>

                  {/* Red badge for count (e.g. 7) */}
                  {btn.badge !== undefined && (
                    <View style={styles.badgeCircle}>
                      <ThemedText style={styles.badgeText}>
                        {btn.badge}
                      </ThemedText>
                    </View>
                  )}
                </View>

                <ThemedText style={styles.buttonLabel} numberOfLines={2}>
                  {btn.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingCardWrapper: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: -74,
    zIndex: 20,
  },
  cardContainer: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    width: '100%',
  },
  buttonItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    cursor: 'pointer' as any,
  },
  iconOuter: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleIconBg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPlusBadge: {
    position: 'absolute',
    bottom: -3,
    right: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  badgeCircle: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },
});
