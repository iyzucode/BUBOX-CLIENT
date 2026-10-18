import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';

import { AppThemeProvider, useThemeContext } from '@/context/ThemeContext';
import { AppSidebar } from '@/components/ui/AppSidebar';

function RootLayoutContent() {
  const { theme, isDark } = useThemeContext();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <View
        style={[
          styles.container,
          { backgroundColor: theme.background },
          isDesktop && styles.desktopContainer,
        ]}
      >
        {isDesktop && <AppSidebar />}

        <View style={[styles.content, { backgroundColor: theme.background }]}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: theme.background },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="order" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="addresses" />
            <Stack.Screen name="address-form" />
            <Stack.Screen name="explore" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="admin/index" />
            <Stack.Screen name="admin/menu" />
            <Stack.Screen name="admin/menu-form" />
          </Stack>
        </View>
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const linkId = 'google-font-open-sans';
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700&display=swap';
        document.head.appendChild(link);
      }

      // Prevent iOS Safari from auto-zooming into inputs when focused
      const styleId = 'ios-safari-no-zoom';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          @media screen and (max-width: 768px) {
            input, textarea, select {
              font-size: 16px !important;
            }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <RootLayoutContent />
      </AppThemeProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  desktopContainer: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    height: '100%',
  },
});
