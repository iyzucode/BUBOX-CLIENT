import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

interface AlertBannerProps {
  type?: 'error' | 'warning' | 'success' | 'info';
  title?: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type = 'error',
  title,
  message,
  actionText,
  onAction,
}) => {
  const theme = useTheme();

  const getStyleTokens = () => {
    switch (type) {
      case 'warning':
        return {
          bg: '#F59E0B12',
          border: '#F59E0B40',
          title: '#D97706',
          dot: '#F59E0B',
          action: '#D97706',
        };
      case 'success':
        return {
          bg: '#10B98112',
          border: '#10B98140',
          title: '#059669',
          dot: '#10B981',
          action: '#059669',
        };
      case 'info':
        return {
          bg: '#6366F112',
          border: '#6366F140',
          title: theme.primary,
          dot: theme.primary,
          action: theme.primary,
        };
      case 'error':
      default:
        return {
          bg: '#EF444412',
          border: '#EF444440',
          title: '#DC2626',
          dot: '#EF4444',
          action: '#DC2626',
        };
    }
  };

  const tokens = getStyleTokens();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: tokens.bg, borderColor: tokens.border },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: tokens.dot }]} />
      <View style={styles.content}>
        {title ? (
          <ThemedText
            type="smallBold"
            style={[styles.title, { color: tokens.title }]}
          >
            {title}
          </ThemedText>
        ) : null}
        <ThemedText type="small" style={styles.message}>
          {message}
        </ThemedText>
        {actionText && onAction ? (
          <TouchableOpacity
            onPress={onAction}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <ThemedText
              type="smallBold"
              style={[styles.actionText, { color: tokens.action }]}
            >
              {actionText} →
            </ThemedText>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    width: '100%',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginTop: 6,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
  },
  actionButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
    cursor: 'pointer' as any,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
