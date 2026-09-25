import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Address, CreateAddressRequest } from '@/types/address';

interface AddressFormModalProps {
  visible: boolean;
  initialData?: Address | null;
  onClose: () => void;
  onSubmit: (data: CreateAddressRequest) => void;
  isSubmitting?: boolean;
}

const QUICK_LABELS = ['Rumah', 'Kantor', 'Apartemen', 'Kos', 'Rumah Nenek'];

export const AddressFormModal: React.FC<AddressFormModalProps> = ({
  visible,
  initialData,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const theme = useTheme();

  const [label, setLabel] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [subdistrict, setSubdistrict] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialData) {
      setLabel(initialData.label || '');
      setRecipientName(initialData.recipientName || '');
      setPhoneNumber(initialData.phoneNumber || '');
      setFullAddress(initialData.fullAddress || '');
      setSubdistrict(initialData.subdistrict || '');
      setCity(initialData.city || '');
      setProvince(initialData.province || '');
      setPostalCode(initialData.postalCode || '');
      setNotes(initialData.notes || '');
      setIsPrimary(initialData.isPrimary || false);
    } else {
      setLabel('Rumah');
      setRecipientName('');
      setPhoneNumber('');
      setFullAddress('');
      setSubdistrict('');
      setCity('');
      setProvince('');
      setPostalCode('');
      setNotes('');
      setIsPrimary(false);
    }
    setErrorMessage('');
  }, [initialData, visible]);

  const handleSubmit = () => {
    if (
      !label.trim() ||
      !recipientName.trim() ||
      !phoneNumber.trim() ||
      !fullAddress.trim() ||
      !subdistrict.trim() ||
      !city.trim() ||
      !province.trim() ||
      !postalCode.trim()
    ) {
      setErrorMessage('Mohon lengkapi semua bidang wajib bertanda bintang (*).');
      return;
    }

    setErrorMessage('');
    onSubmit({
      label: label.trim(),
      recipientName: recipientName.trim(),
      phoneNumber: phoneNumber.trim(),
      fullAddress: fullAddress.trim(),
      subdistrict: subdistrict.trim(),
      city: city.trim(),
      province: province.trim(),
      postalCode: postalCode.trim(),
      notes: notes.trim() || undefined,
      isPrimary,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Modal Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <ThemedText type="subtitle" style={styles.headerTitle}>
              {initialData ? 'Ubah Alamat Pengiriman' : 'Tambah Alamat Baru'}
            </ThemedText>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <ThemedText style={{ fontSize: 18, opacity: 0.6 }}>✕</ThemedText>
            </Pressable>
          </View>

          {/* Form Scroll Area */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
          >
            {errorMessage ? (
              <View style={styles.errorBox}>
                <ThemedText type="small" style={styles.errorText}>
                  {errorMessage}
                </ThemedText>
              </View>
            ) : null}

            {/* Quick Labels */}
            <View style={styles.fieldGroup}>
              <ThemedText type="smallBold" style={styles.fieldLabel}>
                Label Alamat *
              </ThemedText>
              <View style={styles.quickLabelRow}>
                {QUICK_LABELS.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setLabel(item)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          label === item
                            ? theme.primary + '20'
                            : theme.backgroundElement,
                        borderColor:
                          label === item ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <ThemedText
                      type="small"
                      style={{
                        color: label === item ? theme.primary : undefined,
                        fontWeight: label === item ? '700' : '400',
                      }}
                    >
                      {item}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
              <TextInput
                value={label}
                onChangeText={setLabel}
                placeholder="Contoh: Rumah, Kantor, Kos"
                placeholderTextColor={theme.border}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundElement,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
              />
            </View>

            {/* Recipient & Phone in 2-column or stack */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <ThemedText type="smallBold" style={styles.fieldLabel}>
                  Nama Penerima *
                </ThemedText>
                <TextInput
                  value={recipientName}
                  onChangeText={setRecipientName}
                  placeholder="Nama Lengkap"
                  placeholderTextColor={theme.border}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundElement,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <ThemedText type="smallBold" style={styles.fieldLabel}>
                  Nomor HP / WhatsApp *
                </ThemedText>
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="08xxxxxxxxxx"
                  placeholderTextColor={theme.border}
                  keyboardType="phone-pad"
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundElement,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Full Address */}
            <View style={styles.fieldGroup}>
              <ThemedText type="smallBold" style={styles.fieldLabel}>
                Alamat Lengkap *
              </ThemedText>
              <TextInput
                value={fullAddress}
                onChangeText={setFullAddress}
                placeholder="Jalan, No Rumah, RT/RW, Blok/Unit"
                placeholderTextColor={theme.border}
                multiline
                numberOfLines={3}
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: theme.backgroundElement,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
              />
            </View>

            {/* Subdistrict & City */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <ThemedText type="smallBold" style={styles.fieldLabel}>
                  Kecamatan / Kelurahan *
                </ThemedText>
                <TextInput
                  value={subdistrict}
                  onChangeText={setSubdistrict}
                  placeholder="Kecamatan"
                  placeholderTextColor={theme.border}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundElement,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <ThemedText type="smallBold" style={styles.fieldLabel}>
                  Kota / Kabupaten *
                </ThemedText>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="Kota / Kab"
                  placeholderTextColor={theme.border}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundElement,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Province & Postal Code */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <ThemedText type="smallBold" style={styles.fieldLabel}>
                  Provinsi *
                </ThemedText>
                <TextInput
                  value={province}
                  onChangeText={setProvince}
                  placeholder="Provinsi"
                  placeholderTextColor={theme.border}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundElement,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <ThemedText type="smallBold" style={styles.fieldLabel}>
                  Kode Pos *
                </ThemedText>
                <TextInput
                  value={postalCode}
                  onChangeText={setPostalCode}
                  placeholder="12345"
                  placeholderTextColor={theme.border}
                  keyboardType="numeric"
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundElement,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Notes / Kurir Landmark */}
            <View style={styles.fieldGroup}>
              <ThemedText type="smallBold" style={styles.fieldLabel}>
                Catatan Kurir / Patokan (Opsional)
              </ThemedText>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Contoh: Pagar hitam depan pohon mangga"
                placeholderTextColor={theme.border}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundElement,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
              />
            </View>

            {/* Toggle Primary Address */}
            <View
              style={[
                styles.primaryToggleRow,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText type="smallBold">Jadikan Alamat Utama</ThemedText>
                <ThemedText type="small" style={{ opacity: 0.6, fontSize: 12 }}>
                  Alamat ini akan otomatis terpilih saat checkout katering
                </ThemedText>
              </View>
              <Switch
                value={isPrimary}
                onValueChange={setIsPrimary}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </ScrollView>

          {/* Modal Footer Actions */}
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <Pressable
              onPress={onClose}
              disabled={isSubmitting}
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              <ThemedText type="smallBold">Batal</ThemedText>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[
                styles.saveBtn,
                { backgroundColor: theme.primary },
                isSubmitting && { opacity: 0.7 },
              ]}
            >
              <ThemedText type="smallBold" style={styles.saveBtnText}>
                {isSubmitting
                  ? 'Menyimpan...'
                  : initialData
                  ? 'Simpan Perubahan'
                  : 'Tambah Alamat'}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
    cursor: 'pointer' as any,
  },
  scrollView: {
    flexGrow: 1,
  },
  formContent: {
    padding: 16,
    gap: 12,
  },
  errorBox: {
    backgroundColor: '#EF444415',
    borderColor: '#EF444440',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    opacity: 0.8,
  },
  quickLabelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  input: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  textArea: {
    height: 72,
    paddingTop: 8,
    paddingBottom: 8,
    textAlignVertical: 'top',
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  primaryToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
