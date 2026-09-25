import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  style?: ViewStyle;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  style,
}) => {
  const theme = useTheme();
  const isButtonDisabled = disabled || isLoading;

  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: theme.backgroundElement,
          borderWidth: 1,
          borderColor: theme.border,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.primary,
        };
      case 'danger':
        return {
          backgroundColor: '#EF444415',
          borderWidth: 1,
          borderColor: '#EF444440',
        };
      case 'primary':
      default:
        return {
          backgroundColor: theme.primary,
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'secondary':
        return theme.text;
      case 'outline':
        return theme.primary;
      case 'danger':
        return '#EF4444';
      case 'primary':
      default:
        return '#FFFFFF';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isButtonDisabled}
      style={({ pressed }) => [
        styles.button,
        getButtonStyle(),
        isButtonDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : theme.primary}
        />
      ) : (
        <ThemedText
          type="smallBold"
          style={[styles.text, { color: getTextColor() }]}
        >
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 16,
    cursor: 'pointer' as any,
    transitionProperty: 'opacity, transform',
    transitionDuration: '120ms',
  } as any,
  text: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed' as any,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.995 }],
  },
});
