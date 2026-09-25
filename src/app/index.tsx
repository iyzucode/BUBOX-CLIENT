import React from 'react';
import {
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { DashboardBannerHeader } from '@/components/dashboard/DashboardBannerHeader';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';

export default function HomeScreen() {
  const router = useRouter();

  const handleActionPress = (buttonId: string) => {
    if (buttonId === 'button-1') {
      router.push('/order');
    } else if (buttonId === 'button-4') {
      router.push('/addresses');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Hero Banner with Avatar & User Info */}
          <DashboardBannerHeader
            onNotificationPress={() => {
              // Action when bell icon is tapped
            }}
          />

          {/* Floating Quick Actions Card (Rancangan Button 1 - 4) */}
          <QuickActionsCard onActionPress={handleActionPress} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: BottomTabInset + 24,
    gap: 16,
  },
});
