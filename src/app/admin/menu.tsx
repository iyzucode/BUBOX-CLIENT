import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  useBatchAssignMenusToDay,
  useDeleteMasterMenu,
  useGetMasterMenus,
  useGetMenuCategories,
  useGetWeeklyMenu,
  useRemoveMenuFromDay,
  useToggleMenuStatus,
} from '@/features/menu/useMenu';
import { MasterMenu, Menu } from '@/types/menu';

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

  // Active top tab: 'schedule' (Jadwal Harian) or 'catalog' (Katalog Master Menu)
  const [activeTab, setActiveTab] = useState<'schedule' | 'catalog'>('schedule');

  // Schedule Tab state
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [selectedMenuIdsForBatch, setSelectedMenuIdsForBatch] = useState<string[]>([]);

  // Catalog Tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Detail Pop-up Modal (Saat Card Diklik)
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetailMenu, setSelectedDetailMenu] = useState<Menu | null>(null);

  // TanStack Query Hooks
  const { data: weeklyData, isLoading: isLoadingWeekly, refetch: refetchWeekly } = useGetWeeklyMenu();
  const { data: masterMenus, isLoading: isLoadingMaster, refetch: refetchMaster } = useGetMasterMenus();
  const { data: categories } = useGetMenuCategories();

  // Mutations
  const toggleStatusMutation = useToggleMenuStatus();
  const deleteMasterMenuMutation = useDeleteMasterMenu();
  const batchAssignMutation = useBatchAssignMenusToDay();
  const removeAssignmentMutation = useRemoveMenuFromDay();

  // Current Day Menus
  const currentDaySchedule = weeklyData?.days?.find((d) => d.dayOfWeek === selectedDay);
  const mainMenus = currentDaySchedule?.mainMenus || [];
  const secondaryMenus = currentDaySchedule?.secondaryMenus || [];
  const assignedMenuIdsCurrentDay = useMemo(() => {
    return [...mainMenus, ...secondaryMenus].map((m) => m.id);
  }, [mainMenus, secondaryMenus]);

  // Filtered Master Menus for Catalog Tab
  const filteredMasterMenus = useMemo(() => {
    if (!masterMenus) return [];
    return masterMenus.filter((m) => {
      const matchSearch = !searchQuery.trim() || m.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategoryFilter === 'ALL' || m.categoryId === selectedCategoryFilter;
      return matchSearch && matchCategory;
    });
  }, [masterMenus, searchQuery, selectedCategoryFilter]);

  // Open Pop-up Detail
  const handleCardPress = (menu: Menu) => {
    setSelectedDetailMenu(menu);
    setDetailModalVisible(true);
  };

  // Open Picker Modal to assign menus to selectedDay
  const handleOpenPickerModal = () => {
    setSelectedMenuIdsForBatch([]);
    setPickerModalVisible(true);
  };

  const handleTogglePickerMenu = (menuId: string) => {
    if (assignedMenuIdsCurrentDay.includes(menuId)) return; // already assigned
    setSelectedMenuIdsForBatch((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  const handleSaveBatchAssignment = async () => {
    if (selectedMenuIdsForBatch.length === 0) return;
    try {
      await batchAssignMutation.mutateAsync({
        dayOfWeek: selectedDay,
        menuIds: selectedMenuIdsForBatch,
      });
      setPickerModalVisible(false);
      setSelectedMenuIdsForBatch([]);
      refetchWeekly();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Gagal menugaskan menu.';
      Alert.alert('Gagal Menugaskan', msg);
    }
  };

  // Unassign Menu from current day
  const handleUnassignMenu = (menu: Menu) => {
    if (!menu.assignmentId) return;
    const assignmentId = menu.assignmentId;
    const confirmAction = async () => {
      try {
        await removeAssignmentMutation.mutateAsync(assignmentId);
        setDetailModalVisible(false);
        setSelectedDetailMenu(null);
        refetchWeekly();
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Gagal melepaskan menu dari jadwal.';
        Alert.alert('Gagal', msg);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Lepaskan hidangan "${menu.name}" dari jadwal hari ${DAYS.find((d) => d.id === selectedDay)?.name}?`)) {
        confirmAction();
      }
    } else {
      Alert.alert(
        'Konfirmasi Lepaskan',
        `Apakah Anda yakin ingin melepaskan "${menu.name}" dari hari ${DAYS.find((d) => d.id === selectedDay)?.name}?`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Lepaskan', style: 'destructive', onPress: confirmAction },
        ]
      );
    }
  };

  // Delete Master Menu
  const handleDeleteMasterMenu = (m: MasterMenu) => {
    const confirmDelete = async () => {
      try {
        await deleteMasterMenuMutation.mutateAsync(m.id);
        refetchMaster();
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Menu tidak dapat dihapus.';
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('Tidak Dapat Dihapus', msg);
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Hapus master menu "${m.name}"? Jika menu masih ditugaskan ke hari apapun, penghapusan akan ditolak.`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Konfirmasi Hapus',
        `Apakah Anda yakin ingin menghapus "${m.name}" dari katalog?`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Hapus', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  // Toggle active status in Master Menu
  const handleToggleStatus = async (menuId: string, currentStatus: boolean) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: menuId,
        isActive: !currentStatus,
      });
      refetchMaster();
      refetchWeekly();
    } catch (err: any) {
      Alert.alert('Gagal', err.response?.data?.message || 'Gagal mengubah status menu.');
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
                    Manajemen Menu Produk
                  </ThemedText>
                  <View
                    style={[
                      styles.activeTotalBadge,
                      { backgroundColor: theme.primaryLight || '#FFF0E8' },
                    ]}
                  >
                    <ThemedText style={[styles.activeTotalText, { color: theme.primary }]}>
                      {weeklyData?.totalMenus || 0} Terjadwal
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.headerSubtitle}>
                  Kelola katalog Master Menu hidangan dan atur penugasan jadwal rotasi mingguan.
                </ThemedText>
              </View>
            </View>

            {/* Top Segmented Navigation Tabs */}
            <View style={[styles.segmentedTabContainer, { backgroundColor: '#F1F5F9' }]}>
              <Pressable
                onPress={() => setActiveTab('schedule')}
                style={[
                  styles.segmentedTabBtn,
                  activeTab === 'schedule' && {
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.segmentedTabText,
                    { color: activeTab === 'schedule' ? theme.primary : '#64748B' },
                    activeTab === 'schedule' && { fontWeight: '800' },
                  ]}
                >
                  📅 Jadwal Harian ({DAYS.find((d) => d.id === selectedDay)?.name})
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('catalog')}
                style={[
                  styles.segmentedTabBtn,
                  activeTab === 'catalog' && {
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.segmentedTabText,
                    { color: activeTab === 'catalog' ? theme.primary : '#64748B' },
                    activeTab === 'catalog' && { fontWeight: '800' },
                  ]}
                >
                  📖 Katalog Master Menu ({masterMenus?.length || 0})
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {/* ========================================================= */}
          {/* TAB 1: JADWAL HARIAN (SENIN - MINGGU) */}
          {/* ========================================================= */}
          {activeTab === 'schedule' && (
            <View style={{ gap: 16 }}>
              {/* Day Selector Chips */}
              <View style={styles.daysScrollWrapper}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.daysScrollContent}
                >
                  {DAYS.map((d) => {
                    const isSelected = selectedDay === d.id;
                    const dayItem = weeklyData?.days?.find((item) => item.dayOfWeek === d.id);
                    const totalDayMenus =
                      (dayItem?.mainMenus?.length || 0) + (dayItem?.secondaryMenus?.length || 0);

                    return (
                      <Pressable
                        key={d.id}
                        onPress={() => setSelectedDay(d.id)}
                        style={[
                          styles.dayChip,
                          isSelected
                            ? { backgroundColor: theme.primary, borderColor: theme.primary }
                            : { backgroundColor: theme.card, borderColor: theme.border },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.dayChipTitle,
                            { color: isSelected ? '#FFFFFF' : theme.secondary },
                            isSelected && { fontWeight: '800' },
                          ]}
                        >
                          {d.name}
                        </ThemedText>
                        <View
                          style={[
                            styles.dayChipBadge,
                            {
                              backgroundColor: isSelected
                                ? 'rgba(255, 255, 255, 0.25)'
                                : '#F1F5F9',
                            },
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.dayChipBadgeText,
                              { color: isSelected ? '#FFFFFF' : '#64748B' },
                            ]}
                          >
                            {totalDayMenus}
                          </ThemedText>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Day Header Bar & Add Menu Button */}
              <View style={[styles.dayScheduleHeaderCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={{ gap: 2 }}>
                  <ThemedText style={[styles.dayScheduleTitle, { color: theme.secondary }]}>
                    Jadwal Menu Hari {DAYS.find((d) => d.id === selectedDay)?.name}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 13, color: '#64748B' }}>
                    {mainMenus.length} Menu Utama • {secondaryMenus.length} Menu Sekunder
                  </ThemedText>
                </View>

                <Pressable
                  onPress={handleOpenPickerModal}
                  style={({ pressed }) => [
                    styles.assignActionBtn,
                    { backgroundColor: theme.primary },
                    pressed && styles.pressed,
                  ]}
                >
                  <ThemedText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                    + Tambah dari Katalog
                  </ThemedText>
                </Pressable>
              </View>

              {isLoadingWeekly ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <ThemedText style={{ color: '#64748B', marginTop: 10 }}>
                    Memuat jadwal hidangan...
                  </ThemedText>
                </View>
              ) : (
                <View style={{ gap: 20 }}>
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
                          Kategori Utama
                        </ThemedText>
                      </View>
                    </View>

                    {mainMenus.length === 0 ? (
                      <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <ThemedText style={{ fontSize: 28 }}>🍲</ThemedText>
                        <ThemedText style={styles.emptyTitle}>
                          Belum ada Menu Utama untuk hari {DAYS.find((d) => d.id === selectedDay)?.name}
                        </ThemedText>
                        <Pressable
                          onPress={handleOpenPickerModal}
                          style={[styles.emptyActionBtn, { backgroundColor: theme.primary }]}
                        >
                          <ThemedText style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                            + Pilih Menu dari Katalog
                          </ThemedText>
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.cardsList}>
                        {mainMenus.map((menu) => (
                          <AssignedMenuCard
                            key={menu.id}
                            menu={menu}
                            theme={theme}
                            onPress={() => handleCardPress(menu)}
                            onUnassign={() => handleUnassignMenu(menu)}
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
                          Menu Sekunder ({secondaryMenus.length})
                        </ThemedText>
                      </View>
                      <View style={[styles.typeBadge, { backgroundColor: '#DCFCE7' }]}>
                        <ThemedText style={[styles.typeBadgeText, { color: '#15803D' }]}>
                          Kategori Sekunder
                        </ThemedText>
                      </View>
                    </View>

                    {secondaryMenus.length === 0 ? (
                      <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <ThemedText style={{ fontSize: 28 }}>🥟</ThemedText>
                        <ThemedText style={styles.emptyTitle}>
                          Belum ada Menu Sekunder untuk hari {DAYS.find((d) => d.id === selectedDay)?.name}
                        </ThemedText>
                        <Pressable
                          onPress={handleOpenPickerModal}
                          style={[styles.emptyActionBtn, { backgroundColor: '#10B981' }]}
                        >
                          <ThemedText style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                            + Pilih Menu Sekunder dari Katalog
                          </ThemedText>
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.cardsList}>
                        {secondaryMenus.map((menu) => (
                          <AssignedMenuCard
                            key={menu.id}
                            menu={menu}
                            theme={theme}
                            onPress={() => handleCardPress(menu)}
                            onUnassign={() => handleUnassignMenu(menu)}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* ========================================================= */}
          {/* TAB 2: KATALOG MASTER MENU (MASTER PRODUK) */}
          {/* ========================================================= */}
          {activeTab === 'catalog' && (
            <View style={{ gap: 16 }}>
              {/* Search & Actions Bar */}
              <View style={[styles.catalogControlCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.catalogTopActionRow}>
                  {/* Search Input */}
                  <View style={styles.searchBox}>
                    <ThemedText style={{ fontSize: 14 }}>🔍</ThemedText>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Cari hidangan master..."
                      placeholderTextColor="#94A3B8"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                      <Pressable onPress={() => setSearchQuery('')}>
                        <ThemedText style={{ color: '#94A3B8', fontSize: 16 }}>✕</ThemedText>
                      </Pressable>
                    )}
                  </View>

                  {/* Add Master Menu Button */}
                  <Pressable
                    onPress={() => router.push('/admin/menu-form' as any)}
                    style={({ pressed }) => [
                      styles.addMasterBtn,
                      { backgroundColor: theme.primary },
                      pressed && styles.pressed,
                    ]}
                  >
                    <ThemedText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                      + Buat Master Menu
                    </ThemedText>
                  </Pressable>
                </View>

                {/* Category Filter Pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 4 }}>
                  <Pressable
                    onPress={() => setSelectedCategoryFilter('ALL')}
                    style={[
                      styles.catFilterPill,
                      selectedCategoryFilter === 'ALL'
                        ? { backgroundColor: theme.primary, borderColor: theme.primary }
                        : { backgroundColor: '#F8FAFC', borderColor: theme.border },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.catFilterPillText,
                        { color: selectedCategoryFilter === 'ALL' ? '#FFFFFF' : '#64748B' },
                        selectedCategoryFilter === 'ALL' && { fontWeight: '700' },
                      ]}
                    >
                      Semua
                    </ThemedText>
                  </Pressable>

                  {categories?.map((c) => {
                    const isSelected = selectedCategoryFilter === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => setSelectedCategoryFilter(c.id)}
                        style={[
                          styles.catFilterPill,
                          isSelected
                            ? { backgroundColor: theme.primary, borderColor: theme.primary }
                            : { backgroundColor: '#F8FAFC', borderColor: theme.border },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.catFilterPillText,
                            { color: isSelected ? '#FFFFFF' : '#64748B' },
                            isSelected && { fontWeight: '700' },
                          ]}
                        >
                          {c.name}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Master Menus Grid / List */}
              {isLoadingMaster ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <ThemedText style={{ color: '#64748B', marginTop: 10 }}>
                    Memuat katalog hidangan...
                  </ThemedText>
                </View>
              ) : filteredMasterMenus.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <ThemedText style={{ fontSize: 32 }}>🍽️</ThemedText>
                  <ThemedText style={styles.emptyTitle}>Tidak ada Master Menu yang cocok</ThemedText>
                  <ThemedText style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center' }}>
                    Coba sesuaikan pencarian kata kunci atau filter kategori Anda.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.cardsList}>
                  {filteredMasterMenus.map((m) => (
                    <MasterMenuCard
                      key={m.id}
                      item={m}
                      theme={theme}
                      onEdit={() => router.push({ pathname: '/admin/menu-form' as any, params: { id: m.id } })}
                      onDelete={() => handleDeleteMasterMenu(m)}
                      onToggleStatus={() => handleToggleStatus(m.id, m.isActive)}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ========================================================= */}
          {/* MODAL 1: PICKER UNTUK ASSIGN MASTER MENU KE HARI INI */}
          {/* ========================================================= */}
          <Modal
            visible={pickerModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setPickerModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.pickerModalCard, { backgroundColor: theme.card }]}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText style={styles.detailModalCategoryLabel}>
                      PENUGASAN MENU HARIAN
                    </ThemedText>
                    <ThemedText style={[styles.detailModalTitle, { color: theme.secondary }]}>
                      Pilih Menu untuk Hari {DAYS.find((d) => d.id === selectedDay)?.name}
                    </ThemedText>
                    <ThemedText style={{ fontSize: 12, color: '#64748B' }}>
                      Pilih satu atau beberapa hidangan dari Master Menu di bawah:
                    </ThemedText>
                  </View>
                  <Pressable onPress={() => setPickerModalVisible(false)} style={styles.closeBtn}>
                    <ThemedText style={{ fontSize: 22, color: '#94A3B8' }}>✕</ThemedText>
                  </Pressable>
                </View>

                {/* List of Master Menus with Checkboxes */}
                <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                  <View style={{ gap: 8, paddingVertical: 4 }}>
                    {masterMenus?.map((m) => {
                      const isAlreadyAssigned = assignedMenuIdsCurrentDay.includes(m.id);
                      const isChecked = selectedMenuIdsForBatch.includes(m.id) || isAlreadyAssigned;

                      return (
                        <Pressable
                          key={m.id}
                          onPress={() => handleTogglePickerMenu(m.id)}
                          disabled={isAlreadyAssigned}
                          style={[
                            styles.pickerItemRow,
                            { borderColor: theme.border },
                            isChecked && !isAlreadyAssigned && { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
                            isAlreadyAssigned && { backgroundColor: '#F8FAFC', opacity: 0.6 },
                          ]}
                        >
                          <View
                            style={[
                              styles.pickerCheckbox,
                              isChecked && { backgroundColor: theme.primary, borderColor: theme.primary },
                              isAlreadyAssigned && { backgroundColor: '#94A3B8', borderColor: '#94A3B8' },
                            ]}
                          >
                            {isChecked && <ThemedText style={{ color: '#FFFFFF', fontSize: 12 }}>✓</ThemedText>}
                          </View>

                          <View style={{ flex: 1, gap: 2 }}>
                            <ThemedText style={{ fontSize: 14, fontWeight: '700', color: theme.secondary }}>
                              {m.name}
                            </ThemedText>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <View
                                style={[
                                  styles.pickerTypeBadge,
                                  {
                                    backgroundColor: m.categoryType === 'UTAMA' ? '#E0F2FE' : '#DCFCE7',
                                  },
                                ]}
                              >
                                <ThemedText
                                  style={{
                                    fontSize: 10,
                                    fontWeight: '700',
                                    color: m.categoryType === 'UTAMA' ? '#0369A1' : '#15803D',
                                  }}
                                >
                                  {m.categoryName} ({m.categoryType === 'UTAMA' ? 'Utama' : 'Sekunder'})
                                </ThemedText>
                              </View>
                              <ThemedText style={{ fontSize: 12, fontWeight: '600', color: theme.primary }}>
                                Rp {m.price.toLocaleString('id-ID')}
                              </ThemedText>
                            </View>
                          </View>

                          {isAlreadyAssigned && (
                            <View style={styles.alreadyBadge}>
                              <ThemedText style={styles.alreadyBadgeText}>Sudah Ada</ThemedText>
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Footer Actions */}
                <View style={[styles.modalActionsRow, { borderTopColor: theme.border }]}>
                  <Pressable
                    onPress={() => setPickerModalVisible(false)}
                    style={[styles.modalActionCancelBtn, { borderColor: theme.border }]}
                  >
                    <ThemedText style={{ color: '#64748B', fontWeight: '600', fontSize: 13 }}>
                      Batal
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={handleSaveBatchAssignment}
                    disabled={selectedMenuIdsForBatch.length === 0 || batchAssignMutation.isPending}
                    style={[
                      styles.modalActionSaveBtn,
                      { backgroundColor: theme.primary },
                      selectedMenuIdsForBatch.length === 0 && { opacity: 0.5 },
                    ]}
                  >
                    {batchAssignMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <ThemedText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                        Tugaskan ({selectedMenuIdsForBatch.length} Menu)
                      </ThemedText>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

          {/* ========================================================= */}
          {/* MODAL 2: DETAIL POP-UP MODAL (Saat Card Jadwal Diklik) */}
          {/* ========================================================= */}
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
                    <View style={styles.modalHeader}>
                      <View style={{ gap: 2, flex: 1 }}>
                        <ThemedText style={styles.detailModalCategoryLabel}>
                          RINCIAN MENU MPASI
                        </ThemedText>
                        <ThemedText style={[styles.detailModalTitle, { color: theme.secondary }]}>
                          {selectedDetailMenu.name}
                        </ThemedText>
                      </View>
                      <Pressable onPress={() => setDetailModalVisible(false)} style={styles.closeBtn}>
                        <ThemedText style={{ fontSize: 22, color: '#94A3B8' }}>✕</ThemedText>
                      </Pressable>
                    </View>

                    <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                      <View style={{ gap: 14 }}>
                        {selectedDetailMenu.imageUrl && (
                          <Image
                            source={{ uri: selectedDetailMenu.imageUrl }}
                            style={styles.detailModalImage}
                            resizeMode="cover"
                          />
                        )}

                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <ThemedText style={{ fontSize: 18, fontWeight: '800', color: theme.primary }}>
                            Rp {selectedDetailMenu.price.toLocaleString('id-ID')}
                          </ThemedText>
                          <View
                            style={[
                              styles.typeBadge,
                              {
                                backgroundColor: selectedDetailMenu.menuType === 'UTAMA' ? '#E0F2FE' : '#DCFCE7',
                              },
                            ]}
                          >
                            <ThemedText
                              style={[
                                styles.typeBadgeText,
                                {
                                  color: selectedDetailMenu.menuType === 'UTAMA' ? '#0369A1' : '#15803D',
                                },
                              ]}
                            >
                              {selectedDetailMenu.category} • {selectedDetailMenu.menuType === 'UTAMA' ? 'Menu Utama' : 'Menu Sekunder'}
                            </ThemedText>
                          </View>
                        </View>

                        {selectedDetailMenu.ingredients && (
                          <View style={styles.detailSectionBox}>
                            <ThemedText style={styles.detailSectionHeading}>🌾 Komposisi Bahan Pangan</ThemedText>
                            <ThemedText style={styles.detailSectionBody}>{selectedDetailMenu.ingredients}</ThemedText>
                          </View>
                        )}

                        {selectedDetailMenu.nutritionInfo && (
                          <View style={styles.detailSectionBox}>
                            <ThemedText style={styles.detailSectionHeading}>📊 Informasi Nutrisi</ThemedText>
                            <ThemedText style={styles.detailSectionBody}>{selectedDetailMenu.nutritionInfo}</ThemedText>
                          </View>
                        )}

                        {selectedDetailMenu.description && (
                          <View style={styles.detailSectionBox}>
                            <ThemedText style={styles.detailSectionHeading}>📝 Deskripsi</ThemedText>
                            <ThemedText style={styles.detailSectionBody}>{selectedDetailMenu.description}</ThemedText>
                          </View>
                        )}
                      </View>
                    </ScrollView>

                    {/* Footer Actions inside detail modal */}
                    <View style={[styles.modalActionsRow, { borderTopColor: theme.border, paddingTop: 14 }]}>
                      <Pressable
                        onPress={() => handleUnassignMenu(selectedDetailMenu)}
                        style={[styles.unassignBtn, { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }]}
                      >
                        <ThemedText style={{ color: '#DC2626', fontWeight: '700', fontSize: 13 }}>
                          Lepaskan dari Hari Ini
                        </ThemedText>
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          const targetId = selectedDetailMenu.id;
                          setDetailModalVisible(false);
                          router.push({ pathname: '/admin/menu-form' as any, params: { id: targetId } });
                        }}
                        style={[styles.modalActionSaveBtn, { backgroundColor: theme.primary }]}
                      >
                        <ThemedText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                          Edit Master Menu
                        </ThemedText>
                      </Pressable>
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

// ==========================================
// COMPONENT: AssignedMenuCard (Di Jadwal Harian)
// ==========================================
function AssignedMenuCard({
  menu,
  theme,
  onPress,
  onUnassign,
}: {
  menu: Menu;
  theme: any;
  onPress: () => void;
  onUnassign: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.compactCard,
        { backgroundColor: theme.card, borderColor: theme.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.compactThumbWrapper}>
        {menu.imageUrl ? (
          <Image source={{ uri: menu.imageUrl }} style={styles.compactThumb} resizeMode="cover" />
        ) : (
          <View style={[styles.compactThumbPlaceholder, { backgroundColor: '#F1F5F9' }]}>
            <ThemedText style={{ fontSize: 24 }}>🍲</ThemedText>
          </View>
        )}
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        <ThemedText style={[styles.cardTitle, { color: theme.secondary }]} numberOfLines={1}>
          {menu.name}
        </ThemedText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[styles.catPillBadge, { backgroundColor: '#F1F5F9' }]}>
            <ThemedText style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
              {menu.category}
            </ThemedText>
          </View>
          <ThemedText style={{ fontSize: 13, fontWeight: '800', color: theme.primary }}>
            Rp {menu.price.toLocaleString('id-ID')}
          </ThemedText>
        </View>
      </View>

      {/* Unassign button */}
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          onUnassign();
        }}
        style={styles.unassignSmallBtn}
        accessibilityLabel="Lepaskan menu dari hari ini"
      >
        <ThemedText style={{ fontSize: 14, color: '#EF4444' }}>✕</ThemedText>
      </Pressable>
    </Pressable>
  );
}

// ==========================================
// COMPONENT: MasterMenuCard (Di Tab Katalog)
// ==========================================
function MasterMenuCard({
  item,
  theme,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  item: MasterMenu;
  theme: any;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <View style={[styles.masterCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.compactThumbWrapper}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.compactThumb} resizeMode="cover" />
        ) : (
          <View style={[styles.compactThumbPlaceholder, { backgroundColor: '#F1F5F9' }]}>
            <ThemedText style={{ fontSize: 24 }}>🍲</ThemedText>
          </View>
        )}
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <ThemedText style={[styles.cardTitle, { color: theme.secondary, flex: 1 }]} numberOfLines={1}>
            {item.name}
          </ThemedText>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: item.categoryType === 'UTAMA' ? '#E0F2FE' : '#DCFCE7' },
            ]}
          >
            <ThemedText
              style={[
                styles.typeBadgeText,
                { color: item.categoryType === 'UTAMA' ? '#0369A1' : '#15803D' },
              ]}
            >
              {item.categoryName}
            </ThemedText>
          </View>
        </View>

        <ThemedText style={{ fontSize: 13, fontWeight: '800', color: theme.primary }}>
          Rp {item.price.toLocaleString('id-ID')}
        </ThemedText>

        {item.description && (
          <ThemedText style={{ fontSize: 11, color: '#64748B' }} numberOfLines={1}>
            {item.description}
          </ThemedText>
        )}

        <View style={styles.masterCardActionRow}>
          <Pressable onPress={onToggleStatus} style={styles.toggleActiveBtn}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: item.isActive ? '#22C55E' : '#94A3B8' },
              ]}
            />
            <ThemedText style={{ fontSize: 12, fontWeight: '600', color: item.isActive ? '#15803D' : '#64748B' }}>
              {item.isActive ? 'Aktif' : 'Non-Aktif'}
            </ThemedText>
          </Pressable>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={onEdit} style={[styles.editSmallBtn, { borderColor: theme.border }]}>
              <ThemedText style={{ fontSize: 12, fontWeight: '700', color: '#0284C7' }}>Ubah</ThemedText>
            </Pressable>
            <Pressable onPress={onDelete} style={[styles.deleteSmallBtn, { borderColor: '#FCA5A5' }]}>
              <ThemedText style={{ fontSize: 12, fontWeight: '700', color: '#DC2626' }}>Hapus</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  activeTotalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeTotalText: {
    fontSize: 12,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  segmentedTabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentedTabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  segmentedTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  daysScrollWrapper: {
    marginHorizontal: -16,
  },
  daysScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  dayChipTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  dayChipBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dayChipBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dayScheduleHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  dayScheduleTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  assignActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  emptyActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 4,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  cardsList: {
    gap: 10,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  compactThumbWrapper: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
  },
  compactThumb: {
    width: '100%',
    height: '100%',
  },
  compactThumbPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  catPillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unassignSmallBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  catalogControlCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  catalogTopActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
    color: '#0F172A',
  },
  addMasterBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  catFilterPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  catFilterPillText: {
    fontSize: 12,
  },
  masterCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  masterCardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  toggleActiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  editSmallBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#F0F9FF',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  deleteSmallBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#FEF2F2',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  pickerModalCard: {
    maxWidth: 520,
    width: '100%',
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  detailModalCard: {
    maxWidth: 500,
    width: '100%',
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  detailModalCategoryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  detailModalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  pickerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 10,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  pickerCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  alreadyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  alreadyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  modalActionCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  modalActionSaveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  unassignBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  detailModalImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  detailSectionBox: {
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
  },
  detailSectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  detailSectionBody: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
