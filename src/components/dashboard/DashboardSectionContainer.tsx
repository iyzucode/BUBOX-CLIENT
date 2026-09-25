import React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

interface DashboardSectionContainerProps {
  title?: string;
  lastUpdateText?: string;
  children?: React.ReactNode;
}

export const DashboardSectionContainer: React.FC<DashboardSectionContainerProps> = ({
  title = 'Ringkasan Operasional',
  lastUpdateText,
  children,
}) => {
  const theme = useTheme();

  const formattedDate =
    lastUpdateText ||
    `Last Update : ${new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })} ${new Date().toLocaleTimeString('id-ID')}`;

  return (
    <View style={styles.sectionWrapper}>
      {/* Header with Title and Timestamp */}
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>
          {title}
        </ThemedText>

        <ThemedText style={styles.lastUpdateText}>
          {formattedDate}
        </ThemedText>
      </View>

      {/* Main Container Card */}
      <View
        style={[
          styles.containerCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        {children ? (
          children
        ) : (
          /* Empty Placeholder State for Future Development */
          <View
            style={[
              styles.emptyContainer,
              {
                borderColor: theme.border,
                backgroundColor: theme.backgroundElement + '40',
              },
            ]}
          >
            <View style={styles.emptyIconCircle}>
              <ThemedText style={{ fontSize: 24 }}>📦</ThemedText>
            </View>
            <ThemedText style={styles.emptyTitle}>
              Container Kosong
            </ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Area ini siap untuk dikembangkan dengan komponen data, metrik KPI, atau grafik sesuai kebutuhan selanjutnya.
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionWrapper: {
    width: '100%',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    flexWrap: 'wrap',
    gap: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  lastUpdateText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#64748B',
  },
  containerCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyContainer: {
    width: '100%',
    minHeight: 180,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 380,
    lineHeight: 18,
  },
});
