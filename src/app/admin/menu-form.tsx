import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  useCreateMasterMenu,
  useGetDetailMasterMenu,
  useGetMenuCategories,
  useUpdateMasterMenu,
} from '@/features/menu/useMenu';
import { CreateMasterMenuRequest, UpdateMasterMenuRequest } from '@/types/menu';

export default function AdminMenuFormScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; categoryId?: string }>();

  const isEditMode = Boolean(params.id);
  const menuId = params.id;

  // Detail query for edit mode
  const { data: menuDetail, isLoading: isLoadingDetail } = useGetDetailMasterMenu(menuId);
  const { data: categories, isLoading: isLoadingCategories } = useGetMenuCategories();

  // Mutations
  const createMasterMenuMutation = useCreateMasterMenu();
  const updateMasterMenuMutation = useUpdateMasterMenu();

  // Form states
  const [formCategoryId, setFormCategoryId] = useState<string>(params.categoryId || '');
  const [formName, setFormName] = useState<string>('');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formIngredients, setFormIngredients] = useState<string>('');
  const [formNutritionInfo, setFormNutritionInfo] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Set default category when categories load
  useEffect(() => {
    if (!formCategoryId && categories && categories.length > 0) {
      setFormCategoryId(categories[0].id);
    }
  }, [categories, formCategoryId]);

  // Populate data when editing
  useEffect(() => {
    if (menuDetail) {
      setFormCategoryId(menuDetail.categoryId);
      setFormName(menuDetail.name);
      setFormPrice(menuDetail.price.toString());
      setFormDescription(menuDetail.description || '');
      setFormIngredients(menuDetail.ingredients || '');
      setFormNutritionInfo(menuDetail.nutritionInfo || '');
      setFormImageUrl(menuDetail.imageUrl || null);
      setFormIsActive(menuDetail.isActive);
    }
  }, [menuDetail]);

  const selectedCategory = categories?.find((c) => c.id === formCategoryId);

  const handlePickImage = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp,image/jpg';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Batas maksimal 1 MB = 1048576 bytes
        if (file.size > 1048576) {
          const fileSizeKb = Math.round(file.size / 1024);
          setFormError(
            `Ukuran file terlalu besar (${fileSizeKb} KB). Batas maksimal ukuran gambar adalah 1 MB (1024 KB).`
          );
          return;
        }

        setFormError(null);
        const reader = new FileReader();
        reader.onload = () => {
          setFormImageUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      };
      input.click();
    }
  };

  const handleRemoveImage = () => {
    setFormImageUrl(null);
  };

  const handleSave = async () => {
    if (!formCategoryId) {
      setFormError('Kategori hidangan wajib dipilih.');
      return;
    }

    if (!formName.trim()) {
      setFormError('Nama hidangan wajib diisi.');
      return;
    }

    const parsedPrice = parseFloat(formPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setFormError('Harga harus berupa angka valid (minimal 0).');
      return;
    }

    setFormError(null);

    try {
      if (isEditMode && menuId) {
        const updateData: UpdateMasterMenuRequest = {
          categoryId: formCategoryId,
          name: formName.trim(),
          price: parsedPrice,
          description: formDescription.trim() || undefined,
          ingredients: formIngredients.trim() || undefined,
          nutritionInfo: formNutritionInfo.trim() || undefined,
          imageUrl: formImageUrl || null,
          isActive: formIsActive,
        };

        await updateMasterMenuMutation.mutateAsync({
          id: menuId,
          data: updateData,
        });
      } else {
        const createData: CreateMasterMenuRequest = {
          categoryId: formCategoryId,
          name: formName.trim(),
          price: parsedPrice,
          description: formDescription.trim() || undefined,
          ingredients: formIngredients.trim() || undefined,
          nutritionInfo: formNutritionInfo.trim() || undefined,
          imageUrl: formImageUrl || null,
          isActive: formIsActive,
        };

        await createMasterMenuMutation.mutateAsync(createData);
      }

      router.back();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Gagal menyimpan master menu.');
    }
  };

  const isSubmitting = createMasterMenuMutation.isPending || updateMasterMenuMutation.isPending;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top Navigation Row */}
            <View style={styles.topNavRow}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.backBtn,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  pressed && styles.pressed,
                ]}
              >
                <ThemedText style={{ fontSize: 16 }}>←</ThemedText>
                <ThemedText style={[styles.backBtnText, { color: theme.secondary }]}>
                  Kembali ke Menu
                </ThemedText>
              </Pressable>
            </View>

            {/* Header Title Card */}
            <View
              style={[
                styles.headerCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <View style={styles.headerTagRow}>
                <View
                  style={[
                    styles.tagBadge,
                    {
                      backgroundColor: isEditMode ? '#EFF6FF' : '#FFF0E8',
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.tagBadgeText,
                      { color: isEditMode ? '#0284C7' : theme.primary },
                    ]}
                  >
                    {isEditMode ? 'EDIT MASTER MENU' : 'TAMBAH MASTER MENU'}
                  </ThemedText>
                </View>
              </View>

              <ThemedText style={[styles.pageTitle, { color: theme.secondary }]}>
                {isEditMode ? 'Ubah Master Menu' : 'Tambah Master Menu Baru'}
              </ThemedText>
              <ThemedText style={styles.pageSubtitle}>
                Daftarkan hidangan ke dalam katalog master. Penugasan ke hari (Senin - Minggu) dilakukan di jadwal harian.
              </ThemedText>
            </View>

            {/* Loading Detail Spinner */}
            {isEditMode && isLoadingDetail && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <ThemedText style={{ color: '#64748B', marginTop: 10 }}>
                  Memuat data hidangan...
                </ThemedText>
              </View>
            )}

            {/* Main Form Content */}
            {(!isEditMode || !isLoadingDetail) && (
              <View
                style={[
                  styles.formCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                {formError && (
                  <View style={styles.errorBanner}>
                    <ThemedText style={styles.errorBannerText}>⚠️ {formError}</ThemedText>
                  </View>
                )}

                {/* 1. Gambar Hidangan (Base64 Maks 1MB) */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.inputLabel}>Foto / Gambar Hidangan</ThemedText>
                  <ThemedText style={styles.fieldHint}>
                    Format gambar JPG, PNG, atau WebP (Maksimal 1 MB). Disimpan dalam format Base64.
                  </ThemedText>

                  {formImageUrl ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image
                        source={{ uri: formImageUrl }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      <View style={styles.imagePreviewActions}>
                        <Pressable
                          onPress={handlePickImage}
                          style={[styles.imgActionBtn, { borderColor: theme.border }]}
                        >
                          <ThemedText style={{ fontSize: 12, fontWeight: '700', color: '#0284C7' }}>
                            Ganti Foto
                          </ThemedText>
                        </Pressable>
                        <Pressable
                          onPress={handleRemoveImage}
                          style={[styles.imgActionBtn, { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }]}
                        >
                          <ThemedText style={{ fontSize: 12, fontWeight: '700', color: '#DC2626' }}>
                            Hapus
                          </ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      onPress={handlePickImage}
                      style={({ pressed }) => [
                        styles.uploadBox,
                        { borderColor: theme.border },
                        pressed && styles.pressed,
                      ]}
                    >
                      <ThemedText style={{ fontSize: 32 }}>📷</ThemedText>
                      <ThemedText style={{ fontSize: 14, fontWeight: '700', color: theme.secondary }}>
                        Pilih Gambar Hidangan
                      </ThemedText>
                      <ThemedText style={{ fontSize: 12, color: '#94A3B8' }}>
                        Klik untuk memilih file foto (Maks. 1 MB)
                      </ThemedText>
                    </Pressable>
                  )}
                </View>

                {/* 2. Pilihan Kategori Makanan (rf_menu_categories) */}
                <View style={styles.formGroup}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <ThemedText style={styles.inputLabel}>Kategori Hidangan *</ThemedText>
                    {selectedCategory && (
                      <View
                        style={[
                          styles.typeBadge,
                          {
                            backgroundColor: selectedCategory.categoryType === 'UTAMA' ? '#E0F2FE' : '#DCFCE7',
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.typeBadgeText,
                            {
                              color: selectedCategory.categoryType === 'UTAMA' ? '#0369A1' : '#15803D',
                            },
                          ]}
                        >
                          {selectedCategory.categoryType === 'UTAMA' ? '🍲 Menu Utama' : '🥗 Menu Sekunder'}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText style={styles.fieldHint}>
                    Tipe menu (Utama / Sekunder) otomatis ditentukan oleh kategori yang dipilih.
                  </ThemedText>

                  {isLoadingCategories ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <View style={styles.presetCategoryRow}>
                      {categories?.map((cat) => {
                        const isSelected = formCategoryId === cat.id;
                        return (
                          <Pressable
                            key={cat.id}
                            onPress={() => setFormCategoryId(cat.id)}
                            style={[
                              styles.catPill,
                              isSelected
                                ? {
                                    backgroundColor: theme.primaryLight || '#FFF0E8',
                                    borderColor: theme.primary,
                                  }
                                : { backgroundColor: '#FFFFFF', borderColor: theme.border },
                            ]}
                          >
                            <ThemedText
                              style={[
                                styles.catPillText,
                                { color: isSelected ? theme.primary : '#64748B' },
                                isSelected && { fontWeight: '700' },
                              ]}
                            >
                              {cat.name}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* 3. Nama Hidangan */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.inputLabel}>Nama Hidangan *</ThemedText>
                  <TextInput
                    style={[styles.inputField, { borderColor: theme.border }]}
                    placeholder="Contoh: Bubur Daging Ayam Wortel"
                    placeholderTextColor="#94A3B8"
                    value={formName}
                    onChangeText={setFormName}
                  />
                </View>

                {/* 4. Harga Satuan */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.inputLabel}>Harga Satuan (Rp) *</ThemedText>
                  <TextInput
                    style={[styles.inputField, { borderColor: theme.border }]}
                    placeholder="Contoh: 25000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={formPrice}
                    onChangeText={setFormPrice}
                  />
                </View>

                {/* 5. Bahan Pangan */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.inputLabel}>Bahan Pangan (Ingredients)</ThemedText>
                  <TextInput
                    style={[styles.inputField, { borderColor: theme.border }]}
                    placeholder="Contoh: Beras organik, fillet dada ayam, wortel segar, kaldu ayam kampung"
                    placeholderTextColor="#94A3B8"
                    value={formIngredients}
                    onChangeText={setFormIngredients}
                  />
                </View>

                {/* 6. Informasi Gizi */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.inputLabel}>Informasi Nutrisi & Gizi</ThemedText>
                  <TextInput
                    style={[styles.inputField, { borderColor: theme.border }]}
                    placeholder="Contoh: Energi 145 kkal, Protein 8.5g, Lemak 3.2g, Zat Besi 1.8mg"
                    placeholderTextColor="#94A3B8"
                    value={formNutritionInfo}
                    onChangeText={setFormNutritionInfo}
                  />
                </View>

                {/* 7. Deskripsi Lengkap */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.inputLabel}>Deskripsi Lengkap</ThemedText>
                  <TextInput
                    style={[styles.inputField, styles.inputArea, { borderColor: theme.border }]}
                    placeholder="Deskripsi cita rasa, tekstur, atau keunggulan nutrisi hidangan ini..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={4}
                    value={formDescription}
                    onChangeText={setFormDescription}
                  />
                </View>

                {/* 8. Status Aktif */}
                <View style={styles.statusToggleRow}>
                  <Pressable
                    onPress={() => setFormIsActive(!formIsActive)}
                    style={[
                      styles.checkboxBox,
                      formIsActive && {
                        backgroundColor: theme.primary,
                        borderColor: theme.primary,
                      },
                    ]}
                  >
                    {formIsActive && (
                      <ThemedText style={{ color: '#FFFFFF', fontSize: 13 }}>✓</ThemedText>
                    )}
                  </Pressable>
                  <View style={{ gap: 2 }}>
                    <ThemedText style={{ fontSize: 14, fontWeight: '700' }}>
                      Status Menu Aktif
                    </ThemedText>
                    <ThemedText style={{ fontSize: 12, color: '#64748B' }}>
                      Menu aktif dapat ditugaskan ke jadwal hari dan tampil di katalog
                    </ThemedText>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={[styles.formActionRow, { borderTopColor: theme.border }]}>
                  <Pressable
                    onPress={() => router.back()}
                    disabled={isSubmitting}
                    style={[styles.cancelBtn, { borderColor: theme.border }]}
                  >
                    <ThemedText style={{ color: '#64748B', fontWeight: '600', fontSize: 14 }}>
                      Batal
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={handleSave}
                    disabled={isSubmitting}
                    style={[
                      styles.saveBtn,
                      { backgroundColor: theme.primary },
                      isSubmitting && { opacity: 0.7 },
                    ]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <ThemedText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                        {isEditMode ? 'Simpan Perubahan' : 'Tambah Master Menu'}
                      </ThemedText>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: BottomTabInset + 40,
    gap: 16,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  headerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 6,
  },
  headerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 20,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 12,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  formGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  fieldHint: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  presetCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  catPillText: {
    fontSize: 13,
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  inputArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  imagePreviewContainer: {
    gap: 10,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 14,
  },
  imagePreviewActions: {
    flexDirection: 'row',
    gap: 10,
  },
  imgActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  statusToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 6,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  formActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  pressed: {
    opacity: 0.8,
  },
});
