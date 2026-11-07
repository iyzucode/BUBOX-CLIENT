import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { resolveLocation } from '@/features/general/useRegions';
import { useTheme } from '@/hooks/use-theme';
import { CUSTOMER_MAX_WIDTH } from '@/hooks/use-customer-layout';
import { ResolvedLocation } from '@/types/region';

/** Titik awal bila belum ada lokasi: pusat Kota Yogyakarta. */
export const DEFAULT_CENTER = { lat: -7.7956, lng: 110.3695 };
const PICKER_MAP_ID = 'bubox-address-picker';

interface GoogleMapPickerProps {
  visible: boolean;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  onClose: () => void;
  onConfirm: (location: ResolvedLocation) => void;
}

interface Suggestion {
  id: string;
  mainText: string;
  secondaryText: string;
  prediction: google.maps.places.PlacePrediction;
}

/**
 * Layar penuh pemilihan lokasi (web): cari alamat, geser peta (pin tetap di tengah),
 * atau pakai lokasi saat ini. Alamat di titik tengah dicari lewat server
 * (GET /General/ResolveLocation) setiap kali peta berhenti digeser.
 * Harus dirender di dalam <APIProvider>.
 */
export const GoogleMapPicker: React.FC<GoogleMapPickerProps> = ({
  visible,
  initialLatitude,
  initialLongitude,
  onClose,
  onConfirm,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const map = useMap(PICKER_MAP_ID);
  const places = useMapsLibrary('places');

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [resolved, setResolved] = useState<ResolvedLocation | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const resolveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeq = useRef(0);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const hasInitial = initialLatitude != null && initialLongitude != null;
  const defaultCenter = hasInitial ? { lat: initialLatitude!, lng: initialLongitude! } : DEFAULT_CENTER;

  // Peta berhenti digeser → cari alamat di titik tengah (ditunda sebentar agar hemat kuota).
  const handleIdle = (mapInstance: google.maps.Map) => {
    const center = mapInstance.getCenter();
    if (!center) return;
    if (resolveTimer.current) clearTimeout(resolveTimer.current);

    setIsResolving(true);
    setResolveError(null);
    resolveTimer.current = setTimeout(async () => {
      const seq = ++requestSeq.current;
      try {
        const result = await resolveLocation(center.lat(), center.lng());
        if (seq === requestSeq.current) setResolved(result);
      } catch (err) {
        if (seq !== requestSeq.current) return;
        const data = (err as { response?: { data?: { message?: string } } })?.response?.data;
        setResolved(null);
        setResolveError(data?.message || 'Alamat di titik ini tidak dapat dimuat.');
      } finally {
        if (seq === requestSeq.current) setIsResolving(false);
      }
    }, 450);
  };

  const handleDragStart = () => {
    setIsResolving(true);
    setSuggestions([]);
  };

  // Pencarian alamat (Places Autocomplete) dengan session token agar dihitung satu sesi.
  const handleSearchChange = (text: string) => {
    setQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!places || text.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      sessionToken.current ??= new places.AutocompleteSessionToken();
      const center = map?.getCenter();
      try {
        const { suggestions: found } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: text.trim(),
          sessionToken: sessionToken.current,
          includedRegionCodes: ['id'],
          language: 'id',
          ...(center ? { locationBias: { center, radius: 50_000 } } : {}),
        });
        setSuggestions(
          found
            .map((s) => s.placePrediction)
            .filter((p): p is google.maps.places.PlacePrediction => !!p)
            .slice(0, 5)
            .map((p) => ({
              id: p.placeId,
              mainText: p.mainText?.text ?? p.text.text,
              secondaryText: p.secondaryText?.text ?? '',
              prediction: p,
            }))
        );
      } catch {
        setSuggestions([]);
      }
    }, 300);
  };

  const handleSelectSuggestion = async (suggestion: Suggestion) => {
    setSuggestions([]);
    setQuery(suggestion.mainText);
    try {
      const place = suggestion.prediction.toPlace();
      await place.fetchFields({ fields: ['location'] });
      if (place.location && map) {
        map.panTo(place.location);
        map.setZoom(17);
      }
    } finally {
      sessionToken.current = null; // sesi pencarian selesai
    }
  };

  const handleUseCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setResolveError('Browser tidak mendukung lokasi otomatis.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        map?.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        map?.setZoom(17);
      },
      () => {
        setIsLocating(false);
        setResolveError('Lokasi tidak bisa diakses. Izinkan akses lokasi di browser, atau cari alamat.');
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  const regionLine = resolved
    ? [resolved.village?.name, resolved.district?.name && `Kec. ${resolved.district.name}`, resolved.city?.name]
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={styles.column}>
          {/* Peta */}
          <View style={styles.mapArea}>
            <Map
              id={PICKER_MAP_ID}
              defaultCenter={defaultCenter}
              defaultZoom={hasInitial ? 17 : 15}
              gestureHandling="greedy"
              disableDefaultUI
              clickableIcons={false}
              onIdle={(ev) => handleIdle(ev.map)}
              onDragstart={handleDragStart}
              style={styles.map}
            />

            {/* Pin tetap di tengah peta */}
            <View pointerEvents="none" style={styles.pinWrapper}>
              <svg width="40" height="52" viewBox="0 0 40 52" aria-hidden>
                <path d="M20 0C9 0 0 9 0 20c0 15 20 32 20 32s20-17 20-32C40 9 31 0 20 0z" fill={theme.primary} />
                <circle cx="20" cy="20" r="7.5" fill="#FFFFFF" />
              </svg>
              <View style={styles.pinShadow} />
            </View>

            {/* Atas: tombol tutup + kotak pencarian */}
            <View style={[styles.topBar, { top: insets.top + 12 }]}>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Tutup peta"
                style={[styles.roundBtn, { backgroundColor: theme.card }]}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.text} strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </Pressable>

              <View style={styles.searchCol}>
                <View style={[styles.searchBox, { backgroundColor: theme.card }]}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary} strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.5" y2="16.5" />
                  </svg>
                  <TextInput
                    value={query}
                    onChangeText={handleSearchChange}
                    placeholder="Cari jalan, gedung, atau area"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.searchInput, { color: theme.text }]}
                    autoCorrect={false}
                  />
                </View>

                {suggestions.length > 0 ? (
                  <ScrollView
                    style={[styles.suggestionList, { backgroundColor: theme.card }]}
                    keyboardShouldPersistTaps="handled"
                  >
                    {suggestions.map((s, index) => (
                      <Pressable
                        key={s.id}
                        onPress={() => handleSelectSuggestion(s)}
                        style={({ pressed }) => [
                          styles.suggestionItem,
                          index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
                          pressed && { backgroundColor: theme.backgroundElement },
                        ]}
                      >
                        <ThemedText style={[styles.suggestionMain, { color: theme.text }]} numberOfLines={1}>
                          {s.mainText}
                        </ThemedText>
                        {s.secondaryText ? (
                          <ThemedText style={[styles.suggestionSub, { color: theme.textSecondary }]} numberOfLines={1}>
                            {s.secondaryText}
                          </ThemedText>
                        ) : null}
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : null}
              </View>
            </View>

            {/* Lokasi saat ini */}
            <Pressable
              onPress={handleUseCurrentLocation}
              accessibilityRole="button"
              accessibilityLabel="Gunakan lokasi saat ini"
              style={[styles.locateBtn, { backgroundColor: theme.card }]}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                  <circle cx="12" cy="12" r="4" />
                  <line x1="12" y1="2" x2="12" y2="5" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="5" y2="12" />
                  <line x1="19" y1="12" x2="22" y2="12" />
                </svg>
              )}
            </Pressable>
          </View>

          {/* Kartu bawah: alamat di titik pin */}
          <View
            style={[
              styles.sheet,
              { backgroundColor: theme.card, paddingBottom: Math.max(insets.bottom, 16) + 4 },
            ]}
          >
            <ThemedText style={[styles.sheetLabel, { color: theme.textSecondary }]}>Lokasi pengantaran</ThemedText>

            {isResolving ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={theme.primary} />
                <ThemedText style={[styles.sheetSub, { color: theme.textSecondary }]}>Mencari alamat…</ThemedText>
              </View>
            ) : resolveError ? (
              <ThemedText style={[styles.sheetError, { color: theme.danger }]}>{resolveError}</ThemedText>
            ) : resolved ? (
              <>
                <ThemedText style={[styles.sheetTitle, { color: theme.text }]} numberOfLines={2}>
                  {resolved.formattedAddress}
                </ThemedText>
                {regionLine ? (
                  <ThemedText style={[styles.sheetSub, { color: theme.textSecondary }]} numberOfLines={1}>
                    {regionLine}
                  </ThemedText>
                ) : null}
              </>
            ) : (
              <ThemedText style={[styles.sheetSub, { color: theme.textSecondary }]}>
                Geser peta untuk menaruh pin di lokasi pengantaran.
              </ThemedText>
            )}

            <Pressable
              onPress={() => resolved && onConfirm(resolved)}
              disabled={!resolved || isResolving}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.confirmBtn,
                { backgroundColor: theme.primary, opacity: !resolved || isResolving ? 0.5 : pressed ? 0.85 : 1 },
              ]}
            >
              <ThemedText style={[styles.confirmText, { color: theme.onPrimary }]}>Pilih lokasi ini</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: CUSTOMER_MAX_WIDTH,
  },
  mapArea: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  } as object,
  pinWrapper: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -20,
    marginTop: -52,
    alignItems: 'center',
  },
  pinShadow: {
    width: 10,
    height: 4,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  topBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' } as object }),
  },
  searchCol: {
    flex: 1,
    gap: 6,
  },
  searchBox: {
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    ...Platform.select({ web: { boxShadow: '0 2px 8px rgba(0,0,0,0.18)' } as object }),
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    ...Platform.select({ web: { outlineWidth: 0 } as object }),
  },
  suggestionList: {
    maxHeight: 280,
    borderRadius: 16,
    ...Platform.select({ web: { boxShadow: '0 4px 14px rgba(0,0,0,0.18)' } as object }),
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    ...Platform.select({ web: { cursor: 'pointer' } as object }),
  },
  suggestionMain: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionSub: {
    fontSize: 12,
    marginTop: 1,
  },
  locateBtn: {
    position: 'absolute',
    right: 14,
    bottom: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } as object }),
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 6,
    ...Platform.select({ web: { boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' } as object }),
  },
  sheetLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  sheetTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  sheetSub: {
    fontSize: 13,
  },
  sheetError: {
    fontSize: 13,
    lineHeight: 19,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 42,
  },
  confirmBtn: {
    marginTop: 12,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } as object }),
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
