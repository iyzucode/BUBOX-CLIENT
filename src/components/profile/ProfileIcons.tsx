import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';

interface SvgIconProps {
  size?: number;
  color?: string;
}

// 1. Tombol Belum Bayar (Briefcase / shopping bag with clasp)
export const OrderIconUnpaid: React.FC<SvgIconProps> = ({ size = 26, color = '#111827' }) => {
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Handle */}
        <path
          d="M9 6V4.5C9 3.67 9.67 3 10.5 3H13.5C14.33 3 15 3.67 15 4.5V6"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Bag body */}
        <path
          d="M4 7C4 5.9 4.9 5 6 5H18C19.1 5 20 5.9 20 7V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V7Z"
          fill={color}
        />
        {/* Front flap cutout */}
        <path
          d="M4 9C4 9 8 13 12 13C16 13 20 9 20 9"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Clasp / Lock */}
        <rect x="10.5" y="11.5" width="3" height="3.5" rx="0.8" fill="#FFFFFF" />
      </svg>
    );
  }
  return <ThemedText style={{ fontSize: size * 0.8 }}>💼</ThemedText>;
};

// 2. Tombol Aktif (Card / Wallet / Package in progress)
export const OrderIconActive: React.FC<SvgIconProps> = ({ size = 26, color = '#111827' }) => {
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Back card / wallet layer */}
        <path
          d="M3 6.5C3 5.4 3.9 4.5 5 4.5H16C17.1 4.5 18 5.4 18 6.5V9H16V6.5H5V15.5H7V17.5H5C3.9 17.5 3 16.6 3 15.5V6.5Z"
          fill={color}
        />
        {/* Front wallet card */}
        <rect x="7" y="8" width="14" height="12" rx="2.5" fill={color} />
        {/* Flap / Clasp */}
        <path
          d="M17 12H21V16H17C15.9 16 15 15.1 15 14C15 12.9 15.9 12 17 12Z"
          fill="#FFFFFF"
        />
        {/* Dot button in clasp */}
        <circle cx="18" cy="14" r="1" fill={color} />
      </svg>
    );
  }
  return <ThemedText style={{ fontSize: size * 0.8 }}>💳</ThemedText>;
};

// 3. Tombol Selesai (Shopping basket with checkmark)
export const OrderIconCompleted: React.FC<SvgIconProps> = ({ size = 26, color = '#111827' }) => {
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Basket handles */}
        <path
          d="M8 8L12 3L16 8"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Basket body */}
        <path
          d="M4 8H20L18.2 17.2C18 18.2 17.1 19 16.1 19H7.9C6.9 19 6 18.2 5.8 17.2L4 8Z"
          fill={color}
        />
        {/* Slits in basket */}
        <path d="M10 11V16M14 11V16" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        {/* Bottom Right Checkmark Badge */}
        <circle cx="17.5" cy="17.5" r="5" fill="#FFFFFF" />
        <circle cx="17.5" cy="17.5" r="4.2" fill={color} />
        <path
          d="M15.5 17.5L17 19L19.5 16"
          stroke="#FFFFFF"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return <ThemedText style={{ fontSize: size * 0.8 }}>🧺</ThemedText>;
};

// 4. Tombol Dibatalkan (Order card with Cross 'X' badge)
export const OrderIconCancelled: React.FC<SvgIconProps> = ({ size = 26, color = '#111827' }) => {
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Back card layer */}
        <path
          d="M3 6.5C3 5.4 3.9 4.5 5 4.5H13V6.5H5V15.5H7V17.5H5C3.9 17.5 3 16.6 3 15.5V6.5Z"
          fill={color}
        />
        {/* Front card */}
        <rect x="7" y="8" width="14" height="12" rx="2.5" fill={color} />
        {/* Badge 'X' at Top-Right */}
        <circle cx="18" cy="10" r="5" fill="#FFFFFF" />
        <circle cx="18" cy="10" r="4.2" fill={color} />
        <path
          d="M16.5 8.5L19.5 11.5M19.5 8.5L16.5 11.5"
          stroke="#FFFFFF"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return <ThemedText style={{ fontSize: size * 0.8 }}>❌</ThemedText>;
};

// 5. Menu: Detail Profile (User silhouette inside brackets)
export const MenuIconDetailProfile: React.FC<SvgIconProps> = ({ size = 20, color = '#111827' }) => {
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 8V5C4 4.45 4.45 4 5 4H8" />
        <path d="M16 4H19C19.55 4 20 4.45 20 5V8" />
        <path d="M20 16V19C20 19.55 19.55 20 19 20H16" />
        <path d="M8 20H5C4.45 20 4 19.55 4 19V16" />
        <circle cx="12" cy="10" r="3" fill={color} stroke="none" />
        <path d="M7.5 17C7.5 15 9.5 14 12 14C14.5 14 16.5 15 16.5 17" fill={color} stroke="none" />
      </svg>
    );
  }
  return <ThemedText style={{ fontSize: size * 0.8 }}>👤</ThemedText>;
};

// 6. Menu: Kata Sandi (Padlock)
export const MenuIconPassword: React.FC<SvgIconProps> = ({ size = 20, color = '#111827' }) => {
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Shackle */}
        <path
          d="M7 10V7C7 4.24 9.24 2 12 2C14.76 2 17 4.24 17 7V10"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Body */}
        <rect x="5" y="10" width="14" height="11" rx="2.5" fill={color} />
        {/* Keyhole */}
        <circle cx="12" cy="14.5" r="1.3" fill="#FFFFFF" />
        <path d="M12 15.8V18" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return <ThemedText style={{ fontSize: size * 0.8 }}>🔒</ThemedText>;
};

// 7. Menu: Alamat (Location pin on base)
export const MenuIconAddress: React.FC<SvgIconProps> = ({ size = 20, color = '#111827' }) => {
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Pin body */}
        <path
          d="M12 2C8.69 2 6 4.69 6 8C6 12.5 12 19 12 19C12 19 18 12.5 18 8C18 4.69 15.31 2 12 2Z"
          fill={color}
        />
        {/* Inner dot */}
        <circle cx="12" cy="8" r="2.5" fill="#FFFFFF" />
        {/* Base shadow line */}
        <ellipse cx="12" cy="21" rx="5" ry="1.2" fill={color} opacity="0.4" />
      </svg>
    );
  }
  return <ThemedText style={{ fontSize: size * 0.8 }}>📍</ThemedText>;
};

// 8. Menu: Tema (Sun/Palette/Yin-Yang with rays)
export const MenuIconTheme: React.FC<SvgIconProps> = ({ size = 20, color = '#111827' }) => {
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" />
        <path d="M12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17V7Z" fill={color} />
        {/* Rays around */}
        <path
          d="M12 2V4M12 20V22M2 12H4M20 12H22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return <ThemedText style={{ fontSize: size * 0.8 }}>🎨</ThemedText>;
};

// 9. Menu: Bantuan (Customer support headset)
export const MenuIconHelp: React.FC<SvgIconProps> = ({ size = 20, color = '#111827' }) => {
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18V12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12V18" />
        <path d="M21 15C21 16.66 19.66 18 18 18H17V13H18C19.66 13 21 14.34 21 15Z" fill={color} />
        <path d="M3 15C3 14.34 4.34 13 6 13H7V18H6C4.34 18 3 16.66 3 15Z" fill={color} />
        <path d="M18 18V20C18 20.55 17.55 21 17 21H13" />
        <circle cx="12" cy="21" r="1" fill={color} />
      </svg>
    );
  }
  return <ThemedText style={{ fontSize: size * 0.8 }}>🎧</ThemedText>;
};

// 10. Menu: Laporkan Masalah (Info / Exclamation circle)
export const MenuIconReport: React.FC<SvgIconProps> = ({ size = 20, color = '#111827' }) => {
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
        <path d="M12 7V13" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="12" cy="16.5" r="1.3" fill={color} />
      </svg>
    );
  }
  return <ThemedText style={{ fontSize: size * 0.8 }}>ℹ️</ThemedText>;
};

// 11. Menu: Tentang Luanna (Question circle)
export const MenuIconAbout: React.FC<SvgIconProps> = ({ size = 20, color = '#111827' }) => {
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
        <path
          d="M9.5 9.5C9.5 8.12 10.62 7 12 7C13.38 7 14.5 8.12 14.5 9.5C14.5 11 12 11.8 12 13.5"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="16.5" r="1.3" fill={color} />
      </svg>
    );
  }
  return <ThemedText style={{ fontSize: size * 0.8 }}>❓</ThemedText>;
};

// 12. Menu: Bahasa (Translation / Globe)
export const MenuIconLanguage: React.FC<SvgIconProps> = ({ size = 20, color = '#111827' }) => {
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Document 1: Letter A */}
        <rect x="3" y="4" width="11" height="13" rx="2" fill={color} />
        <path d="M6.5 14L8.5 8.5L10.5 14M7.2 12.2H9.8" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Document 2: Asian character */}
        <rect x="10" y="8" width="11" height="13" rx="2" fill="#FFFFFF" stroke={color} strokeWidth="1.8" />
        <path d="M15.5 10.5V12M13 12H18M13.5 14C14.5 16 16.5 17.5 18 18M17.5 14C16.5 15.5 15 17 13 18" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  return <ThemedText style={{ fontSize: size * 0.8 }}>🌐</ThemedText>;
};

// 13. Menu: Log out (Door with left exit arrow)
export const MenuIconLogout: React.FC<SvgIconProps> = ({ size = 20, color = '#111827' }) => {
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5C4.45 21 4 20.55 4 20V4C4 3.45 4.45 3 5 3H9" />
        <path d="M16 17L21 12L16 7" />
        <path d="M21 12H9" />
      </svg>
    );
  }
  return <ThemedText style={{ fontSize: size * 0.8 }}>🚪</ThemedText>;
};

// 14. Chevron Right Arrow
export const ChevronRight: React.FC<SvgIconProps> = ({ size = 16, color = '#6B7280' }) => {
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18L15 12L9 6" />
      </svg>
    );
  }
  return <ThemedText style={{ fontSize: size * 0.8, color }}>›</ThemedText>;
};
