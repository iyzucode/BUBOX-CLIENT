import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  useDeleteMenu,
  useGetWeeklyMenu,
  useToggleMenuStatus,
} from '@/features/menu/useMenu';
import { Menu } from '@/types/menu';

const DAYS = [
  { id: 1, name: 'Senin' },
  { id: 2, name: 'Selasa' },
  { id: 3, name: 'Rabu' },
  { id: 4, name: 'Kamis' },
  { id: 5, name: 'Jumat' },
  { id: 6, name: 'Sabtu' },
  { id: 7, name: 'Minggu' },
];

export default function AdminMenuScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [selectedDay, setSelectedDay] = useState<number>(1);

  // Detail Pop-up Modal (Saat Card Diklik)
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetailMenu, setSelectedDetailMenu] = useState<Menu | null>(null);

  // TanStack Query Hooks
  const { data: weeklyData, isLoading, refetch } = useGetWeeklyMenu();
  const deleteMenuMutation = useDeleteMenu();
  const toggleStatusMutation = useToggleMenuStatus();

  const currentDaySchedule = weeklyData?.days?.find((d) => d.dayOfWeek === selectedDay);
  const mainMenus = currentDaySchedule?.mainMenus || [];
  const secondaryMenus = currentDaySchedule?.secondaryMenus || [];

  // Buka Pop-up Detail saat kartu diklik
  const handleCardPress = (menu: Menu) => {
    setSelectedDetailMenu(menu);
    setDetailModalVisible(true);
  };

  // Navigasi ke halaman form tambah menu baru
  const navigateToCreateForm = (menuType: 'UTAMA' | 'SEKUNDER' = 'UTAMA') => {
    router.push({
      pathname: '/admin/menu-form' as any,
      params: {
        day: selectedDay.toString(),
        type: menuType,
      },
    });
  };

  // Navigasi ke halaman form edit dari pop-up detail
  const handleEditFromDetail = () => {
    if (selectedDetailMenu) {
      const targetId = selectedDetailMenu.id;
      setDetailModalVisible(false);
      router.push({
        pathname: '/admin/menu-form' as any,
        params: {
          id: targetId,
        },
      });
    }
  };

  // Toggle status aktif/non-aktif langsung dari pop-up detail
  const handleToggleFromDetail = async () => {
    if (selectedDetailMenu) {
      const newStatus = !selectedDetailMenu.isActive;
      await toggleStatusMutation.mutateAsync({
        id: selectedDetailMenu.id,
        isActive: newStatus,
      });
      setSelectedDetailMenu((prev) => (prev ? { ...prev, isActive: newStatus } : null));
    }
  };

  // Hapus menu dari pop-up detail
  const handleDeleteFromDetail = () => {
    if (!selectedDetailMenu) return;
    const target = selectedDetailMenu;

    const confirmDelete = async () => {
      await deleteMenuMutation.mutateAsync(target.id);
      setDetailModalVisible(false);
      setSelectedDetailMenu(null);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Yakin ingin menghapus menu "${target.name}"?`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Konfirmasi Hapus',
        `Apakah Anda yakin ingin menghapus menu "${target.name}"?`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Hapus', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Card */}
          <View
            style={[
              styles.headerCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.headerTitleRow}>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ThemedText style={[styles.headerTitle, { color: theme.secondary }]}>
                    Kelola Menu Harian
                  </ThemedText>
                  <View
                    style={[
                      styles.activeTotalBadge,
                      { backgroundColor: theme.primaryLight || '#FFF0E8' },
                    ]}
                  >
                    <ThemedText style={[styles.activeTotalText, { color: theme.primary }]}>
                      {weeklyData?.totalMenus || 0} Menu
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.headerSubtitle}>
                  Klik pada kartu hidangan untuk melihat detail lengkap, nutrisi, atau mengubah data.
                </ThemedText>
              </View>

              <Pressable
                onPress={() => navigateToCreateForm('UTAMA')}
                style={({ pressed }) => [
                  styles.addMenuBtn,
                  { backgroundColor: theme.primary },
                  pressed && styles.pressed,
                ]}
              >
                <ThemedText style={styles.addMenuBtnText}>+ Tambah Menu</ThemedText>
              </Pressable>
            </View>

            {/* 7-Day Selector Pills */}
            <View style={styles.daysTabContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.daysTabScroll}
              >
                {DAYS.map((day) => {
                  const isSelected = selectedDay === day.id;
                  const dayData = weeklyData?.days?.find((d) => d.dayOfWeek === day.id);
                  const count =
                    (dayData?.mainMenus?.length || 0) + (dayData?.secondaryMenus?.length || 0);

                  return (
                    <Pressable
                      key={day.id}
                      onPress={() => setSelectedDay(day.id)}
                      style={({ pressed }) => [
                        styles.dayTabItem,
                        isSelected
                          ? { backgroundColor: theme.primary, borderColor: theme.primary }
                          : { backgroundColor: '#F8FAFC', borderColor: theme.border },
                        pressed && styles.pressed,
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.dayTabText,
                          { color: isSelected ? '#FFFFFF' : '#475569' },
                          isSelected && { fontWeight: '800' },
                        ]}
                      >
                        {day.name}
                      </ThemedText>
                      <View
                        style={[
                          styles.dayTabCountBadge,
                          {
                            backgroundColor: isSelected
                              ? 'rgba(255, 255, 255, 0.25)'
                              : '#E2E8F0',
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.dayTabCountText,
                            { color: isSelected ? '#FFFFFF' : '#64748B' },
                          ]}
                        >
                          {count}
                        </ThemedText>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <ThemedText style={{ color: '#64748B', marginTop: 8 }}>
                Memuat menu hari {DAYS.find((d) => d.id === selectedDay)?.name}...
              </ThemedText>
            </View>
          )}

          {/* Content Section when loaded */}
          {!isLoading && (
            <View style={styles.menuSectionsContainer}>
              {/* SECTION 1: MENU UTAMA */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ThemedText style={{ fontSize: 20 }}>🍲</ThemedText>
                    <ThemedText style={styles.sectionHeading}>
                      Menu Utama ({mainMenus.length})
                    </ThemedText>
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: '#E0F2FE' }]}>
                    <ThemedText style={[styles.typeBadgeText, { color: '#0369A1' }]}>
                      Wajib Berbeda Tiap Hari
                    </ThemedText>
                  </View>
                </View>

                <ThemedText style={styles.sectionDescription}>
                  Menu pokok harian bayi. Klik kartu untuk melihat detail gizi dan tindakan kelola.
                </ThemedText>

                {mainMenus.length === 0 ? (
                  <View
                    style={[
                      styles.emptyCard,
                      { backgroundColor: theme.card, borderColor: theme.border },
                    ]}
                  >
                    <ThemedText style={{ fontSize: 28 }}>🥣</ThemedText>
                    <ThemedText style={styles.emptyTitle}>
                      Belum ada Menu Utama untuk hari {DAYS.find((d) => d.id === selectedDay)?.name}
                    </ThemedText>
                    <Pressable
                      onPress={() => navigateToCreateForm('UTAMA')}
                      style={[styles.emptyActionBtn, { backgroundColor: theme.primary }]}
                    >
                      <ThemedText style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                        + Tambah Menu Utama
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.cardsList}>
                    {mainMenus.map((menu) => (
                      <CompactMenuCard
                        key={menu.id}
                        menu={menu}
                        theme={theme}
                        onPress={() => handleCardPress(menu)}
                      />
                    ))}
                  </View>
                )}
              </View>

              {/* SECTION 2: MENU SEKUNDER */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ThemedText style={{ fontSize: 20 }}>🥗</ThemedText>
                    <ThemedText style={styles.sectionHeading}>
                      Menu Sekunder / Pendamping ({secondaryMenus.length})
                    </ThemedText>
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: '#DCFCE7' }]}>
                    <ThemedText style={[styles.typeBadgeText, { color: '#15803D' }]}>
                      Fleksibel (Lauk Tambahan / Snack)
                    </ThemedText>
                  </View>
                </View>

                <ThemedText style={styles.sectionDescription}>
                  Menu pelengkap harian bayi. Klik kartu untuk melihat detail atau mengubah data.
                </ThemedText>

                {secondaryMenus.length === 0 ? (
                  <View
                    style={[
                      styles.emptyCard,
                      { backgroundColor: theme.card, borderColor: theme.border },
                    ]}
                  >
                    <ThemedText style={{ fontSize: 28 }}>🥟</ThemedText>
                    <ThemedText style={styles.emptyTitle}>
                      Belum ada Menu Sekunder untuk hari{' '}
                      {DAYS.find((d) => d.id === selectedDay)?.name}
                    </ThemedText>
                    <Pressable
                      onPress={() => navigateToCreateForm('SEKUNDER')}
                      style={[styles.emptyActionBtn, { backgroundColor: '#10B981' }]}
                    >
                      <ThemedText style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                        + Tambah Menu Sekunder
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.cardsList}>
                    {secondaryMenus.map((menu) => (
                      <CompactMenuCard
                        key={menu.id}
                        menu={menu}
                        theme={theme}
                        onPress={() => handleCardPress(menu)}
                      />
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* DETAIL POP-UP MODAL (Saat Card Diklik) */}
          <Modal
            visible={detailModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setDetailModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.detailModalCard, { backgroundColor: theme.card }]}>
                {selectedDetailMenu && (
                  <>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                      <View style={{ gap: 2, flex: 1 }}>
                        <ThemedText style={styles.detailModalCategoryLabel}>
                          RINCIAN MENU MPASI
                        </ThemedText>
                        <ThemedText style={[styles.detailModalTitle, { color: theme.secondary }]}>
                          {selectedDetailMenu.name}
                        </ThemedText>
                      </View>
                      <Pressable
                        onPress={() => setDetailModalVisible(false)}
                        style={styles.closeBtn}
                        accessibilityLabel="Tutup"
                      >
                        <ThemedText style={{ fontSize: 22, color: '#94A3B8' }}>✕</ThemedText>
                      </Pressable>
                    </View>

                    {/* Quick Badges Row */}
                    <View style={styles.detailBadgesRow}>
                      <View
                        style={[
                          styles.catTag,
                          {
                            backgroundColor:
                              selectedDetailMenu.menuType === 'UTAMA' ? '#EFF6FF' : '#F0FDF4',
                            borderColor:
                              selectedDetailMenu.menuType === 'UTAMA' ? '#BFDBFE' : '#BBF7D0',
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.catTagText,
                            {
                              color:
                                selectedDetailMenu.menuType === 'UTAMA' ? '#1D4ED8' : '#15803D',
                            },
                          ]}
                        >
                          {selectedDetailMenu.category}
                        </ThemedText>
                      </View>

                      <View
                        style={[
                          styles.dayBadgePill,
                          { backgroundColor: '#F8FAFC', borderColor: theme.border },
                        ]}
                      >
                        <ThemedText style={styles.dayBadgePillText}>
                          📅 Hari {selectedDetailMenu.dayName}
                        </ThemedText>
                      </View>

                      <View
                        style={[
                          styles.typeBadgePill,
                          {
                            backgroundColor:
                              selectedDetailMenu.menuType === 'UTAMA' ? '#E0F2FE' : '#DCFCE7',
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.typeBadgePillText,
                            {
                              color:
                                selectedDetailMenu.menuType === 'UTAMA' ? '#0369A1' : '#15803D',
                            },
                          ]}
                        >
                          {selectedDetailMenu.menuType === 'UTAMA'
                            ? 'Menu Utama'
                            : 'Menu Sekunder'}
                        </ThemedText>
                      </View>

                      <View
                        style={[
                          styles.statusBadgePill,
                          {
                            backgroundColor: selectedDetailMenu.isActive ? '#DCFCE7' : '#F1F5F9',
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.statusBadgePillText,
                            { color: selectedDetailMenu.isActive ? '#15803D' : '#64748B' },
                          ]}
                        >
                          {selectedDetailMenu.isActive ? '🟢 Aktif' : '⚪ Non-Aktif'}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Image Banner if available */}
                    {selectedDetailMenu.imageUrl && (
                      <Image
                        source={{ uri: selectedDetailMenu.imageUrl }}
                        style={styles.detailHeroImage}
                        resizeMode="cover"
                      />
                    )}

                    {/* Price Banner */}
                    <View
                      style={[
                        styles.priceBanner,
                        {
                          backgroundColor: theme.primaryLight || '#FFF0E8',
                          borderColor: theme.primary,
                        },
                      ]}
                    >
                      <ThemedText style={[styles.priceBannerLabel, { color: theme.secondary }]}>
                        Harga Satuan
                      </ThemedText>
                      <ThemedText style={[styles.priceBannerValue, { color: theme.primary }]}>
                        Rp {Number(selectedDetailMenu.price).toLocaleString('id-ID')}
                      </ThemedText>
                    </View>

                    {/* Scrollable Detailed Info */}
                    <ScrollView
                      style={styles.detailScroll}
                      showsVerticalScrollIndicator={false}
                    >
                      {/* Deskripsi */}
                      <View style={styles.detailSectionBox}>
                        <ThemedText style={styles.detailSectionLabel}>
                          📝 Deskripsi Menu
                        </ThemedText>
                        <ThemedText style={styles.detailSectionText}>
                          {selectedDetailMenu.description || 'Tidak ada deskripsi tambahan.'}
                        </ThemedText>
                      </View>

                      {/* Komposisi Bahan */}
                      <View style={styles.detailSectionBox}>
                        <ThemedText style={styles.detailSectionLabel}>
                          🥣 Bahan Pangan (Ingredients)
                        </ThemedText>
                        <ThemedText style={styles.detailSectionText}>
                          {selectedDetailMenu.ingredients || 'Belum ada data bahan pangan.'}
                        </ThemedText>
                      </View>

                      {/* Informasi Gizi */}
                      <View style={styles.detailSectionBox}>
                        <ThemedText style={styles.detailSectionLabel}>
                          📊 Informasi Nutrisi & Gizi
                        </ThemedText>
                        <ThemedText style={styles.detailSectionText}>
                          {selectedDetailMenu.nutritionInfo || 'Belum ada informasi nutrisi gizi.'}
                        </ThemedText>
                      </View>
                    </ScrollView>

                    {/* Detail Actions Footer */}
                    <View style={[styles.detailFooterActions, { borderTopColor: theme.border }]}>
                      <Pressable
                        onPress={handleToggleFromDetail}
                        disabled={toggleStatusMutation.isPending}
                        style={[
                          styles.detailActionBtn,
                          {
                            backgroundColor: selectedDetailMenu.isActive ? '#F8FAFC' : '#ECFDF5',
                            borderColor: selectedDetailMenu.isActive ? theme.border : '#6EE7B7',
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.detailActionBtnText,
                            { color: selectedDetailMenu.isActive ? '#64748B' : '#059669' },
                          ]}
                        >
                          {selectedDetailMenu.isActive ? '⚪ Nonaktifkan' : '🟢 Aktifkan'}
                        </ThemedText>
                      </Pressable>

                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Pressable
                          onPress={handleEditFromDetail}
                          style={[
                            styles.detailActionBtn,
                            { borderColor: '#0284C7', backgroundColor: '#F0F9FF' },
                          ]}
                        >
                          <ThemedText
                            style={[styles.detailActionBtnText, { color: '#0284C7' }]}
                          >
                            ✏️ Edit
                          </ThemedText>
                        </Pressable>

                        <Pressable
                          onPress={handleDeleteFromDetail}
                          disabled={deleteMenuMutation.isPending}
                          style={[
                            styles.detailActionBtn,
                            { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
                          ]}
                        >
                          <ThemedText
                            style={[styles.detailActionBtnText, { color: '#DC2626' }]}
                          >
                            🗑️ Hapus
                          </ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// =========================================================================
// COMPACT LIST CARD (Ringkas & Minimalis, Pop-up muncul saat diklik)
// =========================================================================

interface CompactMenuCardProps {
  menu: Menu;
  theme: any;
  onPress: () => void;
}

const CompactMenuCard: React.FC<CompactMenuCardProps> = ({ menu, theme, onPress }) => {
  const isUtama = menu.menuType === 'UTAMA';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.compactCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: menu.isActive ? 1 : 0.65,
        },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Menu ${menu.name}, Klik untuk melihat detail`}
    >
      <View style={styles.compactCardLeft}>
        {/* Menu Thumbnail or Fallback Icon */}
        {menu.imageUrl ? (
          <Image source={{ uri: menu.imageUrl }} style={styles.compactThumbnail} />
        ) : (
          <View
            style={[
              styles.compactThumbnailPlaceholder,
              { backgroundColor: isUtama ? '#EFF6FF' : '#F0FDF4' },
            ]}
          >
            <ThemedText style={{ fontSize: 16 }}>{isUtama ? '🍲' : '🥗'}</ThemedText>
          </View>
        )}

        {/* Category Tag */}
        <View
          style={[
            styles.compactCatTag,
            {
              backgroundColor: isUtama ? '#EFF6FF' : '#F0FDF4',
              borderColor: isUtama ? '#BFDBFE' : '#BBF7D0',
            },
          ]}
        >
          <ThemedText
            style={[
              styles.compactCatTagText,
              { color: isUtama ? '#1D4ED8' : '#15803D' },
            ]}
          >
            {menu.category}
          </ThemedText>
        </View>

        {/* Menu Name */}
        <ThemedText style={styles.compactMenuName} numberOfLines={1}>
          {menu.name}
        </ThemedText>
      </View>

      <View style={styles.compactCardRight}>
        {/* Price */}
        <ThemedText style={[styles.compactMenuPrice, { color: theme.primary }]}>
          Rp {Number(menu.price).toLocaleString('id-ID')}
        </ThemedText>

        {/* Status Indicator Dot/Badge */}
        <View
          style={[
            styles.compactStatusBadge,
            {
              backgroundColor: menu.isActive ? '#DCFCE7' : '#F1F5F9',
            },
          ]}
        >
          <ThemedText
            style={[
              styles.compactStatusText,
              { color: menu.isActive ? '#15803D' : '#94A3B8' },
            ]}
          >
            {menu.isActive ? 'Aktif' : 'Nonaktif'}
          </ThemedText>
        </View>

        {/* Chevron Icon */}
        <View style={styles.chevronBox}>
          <ThemedText style={{ color: '#94A3B8', fontSize: 14, fontWeight: '700' }}>
            ➔
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
};

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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: BottomTabInset + 40,
    gap: 16,
  },
  headerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  activeTotalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeTotalText: {
    fontSize: 11,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  addMenuBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  addMenuBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  daysTabContainer: {
    width: '100%',
  },
  daysTabScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  dayTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    cursor: 'pointer' as any,
  },
  dayTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dayTabCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dayTabCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  menuSectionsContainer: {
    gap: 24,
  },
  sectionBlock: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionDescription: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyActionBtn: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    cursor: 'pointer' as any,
  },

  // ==========================================
  // COMPACT LIST CARD STYLES
  // ==========================================
  cardsList: {
    gap: 10,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    cursor: 'pointer' as any,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  compactCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  compactThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  compactThumbnailPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactCatTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  compactCatTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  compactMenuName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  compactCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactMenuPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  compactStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  compactStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  chevronBox: {
    paddingLeft: 2,
  },

  // ==========================================
  // DETAIL POP-UP MODAL STYLES
  // ==========================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  detailModalCard: {
    maxWidth: 540,
    width: '100%',
    maxHeight: '90%',
    borderRadius: 22,
    padding: 24,
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  detailModalCategoryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  detailModalTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  detailBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  catTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  catTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dayBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  dayBadgePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  typeBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  priceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  detailHeroImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  priceBannerLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  priceBannerValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  detailScroll: {
    maxHeight: 280,
  },
  detailSectionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailSectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  detailSectionText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  detailFooterActions: {
    borderTopWidth: 1,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  detailActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  closeBtn: {
    padding: 4,
    cursor: 'pointer' as any,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },
});
