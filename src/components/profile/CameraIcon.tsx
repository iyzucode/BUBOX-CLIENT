import React from 'react';
import { Platform } from 'react-native';

import { ThemedText } from '@/components/themed-text';

/** Ikon kamera garis untuk tombol ubah foto profil. */
export const CameraIcon: React.FC<{ size?: number; color: string }> = ({ size = 16, color }) =>
  Platform.OS === 'web' ? (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  ) : (
    <ThemedText style={{ fontSize: size * 0.85, color }}>📷</ThemedText>
  );
