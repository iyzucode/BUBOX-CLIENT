import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { useProfilePalette } from './profilePalette';

interface ProfileThemeSwitchProps {
  size?: 'medium' | 'large';
}

export const ProfileThemeSwitch: React.FC<ProfileThemeSwitchProps> = ({
  size = 'large',
}) => {
  const palette = useProfilePalette();
  const themeMode = useThemeStore((s) => s.themeMode);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = themeMode === 'dark';
  const isLarge = size === 'large';
  const iconSize = isLarge ? 16 : 13;

  return (
    <Pressable
      onPress={toggleTheme}
      style={({ pressed }) => [
        styles.trackBase,
        isLarge ? styles.trackLarge : styles.trackMedium,
        {
          backgroundColor: isDark ? '#374151' : '#9CA3AF',
        },
        pressed && styles.pressed,
      ]}
      accessibilityRole="switch"
      accessibilityLabel={`Ganti tema, saat ini mode ${isDark ? 'Gelap' : 'Terang'}`}
      accessibilityState={{ checked: isDark }}
      hitSlop={8}
    >
      <View
        style={[
          styles.thumbBase,
          isLarge ? styles.thumbLarge : styles.thumbMedium,
          isDark ? styles.thumbDark : styles.thumbLight,
          {
            backgroundColor: '#FFFFFF',
          },
        ]}
      >
        {Platform.OS === 'web' && (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
            {isDark ? (
              // Moon icon
              <path
                d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
                fill="#374151"
              />
            ) : (
              // Sun icon
              <>
                <circle cx="12" cy="12" r="5" fill="#4B5563" />
                <path
                  d="M12 1V3M12 21V23M1 12H3M21 12H23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"
                  stroke="#4B5563"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  trackBase: {
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'background-color 0.2s ease' } as any,
    }),
  },
  trackMedium: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 2,
  },
  trackLarge: {
    width: 60,
    height: 32,
    borderRadius: 16,
    padding: 3,
  },
  thumbBase: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.25,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        transition: 'transform 0.2s ease',
      } as any,
    }),
  },
  thumbMedium: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  thumbLarge: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  thumbLight: {
    alignSelf: 'flex-start',
  },
  thumbDark: {
    alignSelf: 'flex-end',
  },
  pressed: {
    opacity: 0.85,
  },
});
