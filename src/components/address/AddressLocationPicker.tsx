import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';

interface AddressLocationPickerProps {
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  height?: number;
}

// Default to Central Jakarta (matches mockups near Thamrin City / Grand Indonesia)
const DEFAULT_LAT = -6.1944;
const DEFAULT_LNG = 106.8186;

export const AddressLocationPicker: React.FC<AddressLocationPickerProps> = ({
  initialLatitude,
  initialLongitude,
  onLocationChange,
  height = 250,
}) => {
  const [currentLat, setCurrentLat] = useState<number>(initialLatitude ?? DEFAULT_LAT);
  const [currentLng, setCurrentLng] = useState<number>(initialLongitude ?? DEFAULT_LNG);
  const [isDragging, setIsDragging] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Sync if initial props change (e.g. edit mode loaded)
  useEffect(() => {
    if (
      initialLatitude != null &&
      initialLongitude != null &&
      (initialLatitude !== currentLat || initialLongitude !== currentLng)
    ) {
      setCurrentLat(initialLatitude);
      setCurrentLng(initialLongitude);
      if (Platform.OS === 'web' && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          {
            type: 'SET_CENTER',
            latitude: initialLatitude,
            longitude: initialLongitude,
          },
          '*'
        );
      }
    }
  }, [initialLatitude, initialLongitude]);

  // Listen to messages from Leaflet iframe
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === 'BUBOX_LOCATION_CHANGED') {
        const { latitude, longitude } = event.data;
        if (typeof latitude === 'number' && typeof longitude === 'number') {
          setCurrentLat(latitude);
          setCurrentLng(longitude);
          onLocationChange(latitude, longitude);
        }
      } else if (event.data.type === 'BUBOX_MAP_DRAGGING') {
        setIsDragging(Boolean(event.data.isDragging));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onLocationChange]);

  const handleGetLocation = () => {
    if (Platform.OS === 'web' && navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentLat(lat);
          setCurrentLng(lng);
          onLocationChange(lat, lng);
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              { type: 'SET_CENTER', latitude: lat, longitude: lng },
              '*'
            );
          }
        },
        (err) => {
          setIsLocating(false);
          console.warn('Geolocation error:', err.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  // Generate self-contained Leaflet HTML
  const leafletSrcDoc = useMemo(() => {
    const startLat = initialLatitude ?? DEFAULT_LAT;
    const startLng = initialLongitude ?? DEFAULT_LNG;
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #F3F4F6;
      user-select: none;
      -webkit-user-select: none;
    }
    .leaflet-control-attribution {
      display: none !important;
    }
    .leaflet-control-zoom {
      display: none !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var initialLat = ${startLat};
    var initialLng = ${startLng};
    var map = L.map('map', {
      center: [initialLat, initialLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      crossOrigin: true
    }).addTo(map);

    function reportCenter() {
      var center = map.getCenter();
      window.parent.postMessage({
        type: 'BUBOX_LOCATION_CHANGED',
        latitude: center.lat,
        longitude: center.lng
      }, '*');
    }

    map.on('movestart', function() {
      window.parent.postMessage({ type: 'BUBOX_MAP_DRAGGING', isDragging: true }, '*');
    });

    map.on('moveend', function() {
      window.parent.postMessage({ type: 'BUBOX_MAP_DRAGGING', isDragging: false }, '*');
      reportCenter();
    });

    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'SET_CENTER') {
        map.setView([e.data.latitude, e.data.longitude], 16, { animate: true });
      }
    });

    setTimeout(reportCenter, 300);
  </script>
</body>
</html>
    `;
  }, []);

  return (
    <View style={[styles.container, { height }]}>
      {/* 1. Leaflet Map Web View */}
      {Platform.OS === 'web' ? (
        <iframe
          ref={iframeRef as any}
          srcDoc={leafletSrcDoc}
          style={
            {
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
              pointerEvents: 'auto',
            } as any
          }
          title="OpenStreetMap Location Picker"
        />
      ) : (
        <View style={styles.fallbackBox}>
          <ThemedText style={{ fontSize: 13, color: '#6B7280' }}>
            Peta Lokasi (OpenStreetMap)
          </ThemedText>
        </View>
      )}

      {/* 2. Fixed Center Pin with Circle (Matching the user's design) */}
      <View style={styles.centerPinOverlay} pointerEvents="none">
        <View style={[styles.pinWrapper, isDragging && styles.pinWrapperLifted]}>
          {Platform.OS === 'web' ? (
            <svg
              width="32"
              height="40"
              viewBox="0 0 24 30"
              fill="none"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' } as any}
            >
              <path
                d="M12 0C5.373 0 0 5.373 0 12c0 8.5 12 18 12 18s12-9.5 12-18c0-6.627-5.373-12-12-12z"
                fill="#111827"
              />
              <circle cx="12" cy="11.5" r="4.2" fill="#FFFFFF" />
            </svg>
          ) : (
            <ThemedText style={{ fontSize: 28 }}>📍</ThemedText>
          )}
          {/* Subtle Ground Shadow Pin Point */}
          <View style={[styles.pinShadow, isDragging && styles.pinShadowLifted]} />
        </View>
      </View>

      {/* 3. Floating Coordinates Badge */}
      <View style={styles.coordsBadge} pointerEvents="none">
        <ThemedText style={styles.coordsText}>
          📍 {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
        </ThemedText>
      </View>

      {/* 4. Floating Button: Current Location (GPS) */}
      <Pressable
        onPress={handleGetLocation}
        disabled={isLocating}
        style={({ pressed }) => [
          styles.gpsButton,
          pressed && styles.gpsButtonPressed,
        ]}
        accessibilityLabel="Gunakan Lokasi GPS Saat Ini"
        accessibilityRole="button"
      >
        {isLocating ? (
          <ActivityIndicator size="small" color="#111827" />
        ) : Platform.OS === 'web' ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#111827"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="7" />
            <line x1="12" y1="1" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="23" />
            <line x1="1" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="23" y2="12" />
            <circle cx="12" cy="12" r="2.5" fill="#111827" />
          </svg>
        ) : (
          <ThemedText style={{ fontSize: 14 }}>🎯</ThemedText>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  fallbackBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  centerPinOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    pointerEvents: 'none' as any,
  },
  pinWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -18 }],
    ...Platform.select({
      web: {
        transition: 'transform 0.15s ease',
      } as any,
    }),
  },
  pinWrapperLifted: {
    transform: [{ translateY: -28 }],
  },
  pinShadow: {
    width: 8,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    marginTop: -2,
    ...Platform.select({
      web: {
        transition: 'transform 0.15s ease, opacity 0.15s ease',
      } as any,
    }),
  },
  pinShadowLifted: {
    transform: [{ scale: 0.6 }],
    opacity: 0.15,
  },
  coordsBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(17, 24, 39, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    zIndex: 12,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(4px)',
      },
    }),
  },
  coordsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  gpsButton: {
    position: 'absolute',
    bottom: 45, // sits cleanly above the overlapping curved bottom sheet
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
    cursor: 'pointer' as any,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      },
      default: {
        elevation: 4,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
    }),
  },
  gpsButtonPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
});
