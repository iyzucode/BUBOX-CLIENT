import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { APIProvider, Map } from '@vis.gl/react-google-maps';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { AddressMapSectionProps } from './AddressMapSection';
import { DEFAULT_CENTER, GoogleMapPicker } from './GoogleMapPicker.web';

const MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const PREVIEW_HEIGHT = 190;

/**
 * Web: pratinjau titik lokasi + tombol yang membuka pemilih Google Maps layar penuh.
 * Setelah dipilih, alamat & wilayah form terisi otomatis lewat onLocationPicked.
 */
export const AddressMapSection: React.FC<AddressMapSectionProps> = ({
  latitude,
  longitude,
  autoOpenPicker = false,
  onLocationPicked,
}) => {
  const theme = useTheme();
  const [isPickerOpen, setIsPickerOpen] = useState(autoOpenPicker && !!MAPS_API_KEY);
  const hasLocation = latitude != null && longitude != null;

  if (!MAPS_API_KEY) {
    return (
      <View style={[styles.placeholder, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText style={[styles.placeholderText, { color: theme.textSecondary }]}>
          Peta Google belum dikonfigurasi (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY). Isi alamat secara manual di bawah.
        </ThemedText>
      </View>
    );
  }

  return (
    <APIProvider apiKey={MAPS_API_KEY} language="id" region="ID">
      <View style={[styles.preview, { backgroundColor: theme.backgroundElement }]}>
        {hasLocation ? (
          <>
            {/* key: render ulang saat titik berubah agar peta pratinjau ikut berpindah */}
            <Map
              key={`${latitude},${longitude}`}
              defaultCenter={{ lat: latitude!, lng: longitude! }}
              defaultZoom={17}
              gestureHandling="none"
              disableDefaultUI
              clickableIcons={false}
              keyboardShortcuts={false}
              style={styles.map}
            />
            <View pointerEvents="none" style={styles.pinWrapper}>
              <svg width="32" height="42" viewBox="0 0 40 52" aria-hidden>
                <path d="M20 0C9 0 0 9 0 20c0 15 20 32 20 32s20-17 20-32C40 9 31 0 20 0z" fill={theme.primary} />
                <circle cx="20" cy="20" r="7.5" fill="#FFFFFF" />
              </svg>
            </View>
          </>
        ) : (
          <View style={styles.emptyPreview}>
            <ThemedText style={[styles.placeholderText, { color: theme.textSecondary }]}>
              Belum ada titik lokasi. Pilih di peta agar kurir mudah menemukan alamatmu.
            </ThemedText>
          </View>
        )}

        <Pressable
          onPress={() => setIsPickerOpen(true)}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.pickBtn,
            { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <ThemedText style={[styles.pickBtnText, { color: theme.onPrimary }]}>
            {hasLocation ? 'Ubah titik di peta' : 'Pilih lokasi di peta'}
          </ThemedText>
        </Pressable>
      </View>

      {isPickerOpen ? (
        <GoogleMapPicker
          visible
          initialLatitude={latitude ?? DEFAULT_CENTER.lat}
          initialLongitude={longitude ?? DEFAULT_CENTER.lng}
          onClose={() => setIsPickerOpen(false)}
          onConfirm={(location) => {
            setIsPickerOpen(false);
            onLocationPicked(location);
          }}
        />
      ) : null}
    </APIProvider>
  );
};

const styles = StyleSheet.create({
  preview: {
    height: PREVIEW_HEIGHT,
    width: '100%',
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  } as object,
  pinWrapper: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -16,
    marginTop: -42,
  },
  emptyPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  placeholder: {
    minHeight: 130,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    // Kartu form di bawah menumpuk 30px ke atas peta
    paddingBottom: 30,
  },
  placeholderText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  pickBtn: {
    position: 'absolute',
    right: 12,
    bottom: 34,
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } as object }),
  },
  pickBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
