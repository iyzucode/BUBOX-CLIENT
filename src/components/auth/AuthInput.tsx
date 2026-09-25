import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  error,
  isPassword = false,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = () => {
    if (error) return theme.danger;
    if (isFocused) return theme.primary;
    return theme.border;
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <ThemedText type="smallBold" style={styles.label}>
          {label}
        </ThemedText>
      </View>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.card,
            borderColor: getBorderColor(),
            borderWidth: isFocused || error ? 1.5 : 1,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: theme.text }, style]}
          placeholderTextColor={theme.textSecondary + '80'}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize="none"
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.toggleButton}
            activeOpacity={0.7}
          >
            <ThemedText
              type="code"
              style={[styles.toggleText, { color: theme.primary }]}
            >
              {showPassword ? 'SEMBUNYIKAN' : 'LIHAT'}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <ThemedText
          type="small"
          style={[styles.errorText, { color: theme.danger }]}
        >
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 6,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.9,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    transitionProperty: 'border-color',
    transitionDuration: '150ms',
  } as any,
  input: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  toggleButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    cursor: 'pointer' as any,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 12,
    marginTop: 2,
  },
});
