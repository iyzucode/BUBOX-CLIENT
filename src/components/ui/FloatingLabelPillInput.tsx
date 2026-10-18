import React, { useRef, useState } from 'react';
import {
  KeyboardTypeOptions,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';

export interface FloatingLabelPillInputProps {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  numberOfLines?: number;
  pillBg?: string;
  textColor?: string;
  labelColor?: string;
  placeholderColor?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  editable?: boolean;
}

export const FloatingLabelPillInput: React.FC<FloatingLabelPillInputProps> = ({
  label,
  hint,
  value,
  onChangeText,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  pillBg = '#B8B8B8',
  textColor = '#111827',
  labelColor = '#6B7280',
  placeholderColor = '#737373',
  containerStyle,
  inputStyle,
  editable = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput | null>(null);

  const hasValue = Boolean(value && value.trim().length > 0);
  const isFloating = isFocused || hasValue;

  // Replicating <fieldset> & <legend> pattern:
  // - When floating:
  //   * If focused: show the hint (e.g. "Cth: Rumah Utama, Kos, Apartemen")
  //   * If not focused: no placeholder (displays the user's typed value)
  // - When NOT floating:
  //   * show the field label inside the pill (e.g. "Nama alamat", "Nama penerima")
  const activePlaceholder = isFloating ? (isFocused ? hint || '' : '') : label;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* 1. Simulated <legend> using absolute positioning: ZERO layout shift! */}
      {isFloating && (
        <Pressable
          onPress={() => inputRef.current?.focus()}
          style={styles.legendWrapper}
          accessibilityRole="none"
        >
          <ThemedText style={[styles.legendText, { color: labelColor }]}>
            {label}
          </ThemedText>
        </Pressable>
      )}

      {/* 2. The Pill Input (Fixed vertical position - Never shifts!) */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={activePlaceholder}
        placeholderTextColor={placeholderColor}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        editable={editable}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.pillInput,
          multiline && styles.multilineInput,
          {
            backgroundColor: pillBg,
            color: textColor,
          },
          inputStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    // Pre-allocated clearance for floating legend above the pill (simulating <fieldset> top border space)
    paddingTop: 16,
  },
  legendWrapper: {
    position: 'absolute',
    top: 0,
    left: 18,
    zIndex: 2,
    ...Platform.select({
      web: {
        cursor: 'text',
      } as any,
    }),
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.15,
  },
  pillInput: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
    outlineStyle: 'none' as any,
  },
  multilineInput: {
    minHeight: 52,
    textAlignVertical: 'center',
  },
});
