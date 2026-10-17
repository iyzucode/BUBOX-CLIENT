import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { useProfilePalette } from './profilePalette';

export const ProfileThemeSwitch: React.FC = () => {
  const palette = useProfilePalette();
  const themeMode = useThemeStore((s) => s.themeMode);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = themeMode === 'dark';

  return (
    <Pressable
      onPress={toggleTheme}
      style={({ pressed }) => [
        styles.track,
        {
          backgroundColor: isDark ? '#374151' : '#9CA3AF',
        },
        pressed && styles.pressed,
      ]}
      accessibilityRole="switch"
      accessibilityLabel={`Ganti tema, saat ini mode ${isDark ? 'Gelap' : 'Terang'}`}
      accessibilityState={{ checked: isDark }}
      hitSlop={6}
    >
      <View
        style={[
          styles.thumb,
          isDark ? styles.thumbDark : styles.thumbLight,
          {
            backgroundColor: '#FFFFFF',
          },
        ]}
      >
        {Platform.OS === 'web' && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
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
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'background-color 0.2s ease' } as any,
    }),
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        transition: 'transform 0.2s ease',
      } as any,
    }),
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
