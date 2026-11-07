import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardTypeOptions,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand } from '@/constants/theme';
import { useThemeContext } from '@/context/ThemeContext';
import {
  formatChangeDate,
  profileErrorMessage,
  useProfile,
  useUpdateContact,
  useUpdateFullName,
  useUpdateUsername,
} from '@/features/auth/useProfile';
import { useCustomerLayout } from '@/hooks/use-customer-layout';
import { useAuthStore } from '@/store/useAuthStore';
import { EditableProfileField, Profile } from '@/types/profile';

interface FieldConfig {
  title: string;
  rule: string;
  placeholder: string;
  keyboardType: KeyboardTypeOptions;
  autoCapitalize: 'none' | 'words';
  maxLength: number;
  /** Boleh dikosongkan (nomor kontak). */
  optional: boolean;
  initialValue: (p: Profile) => string;
  lockedUntil: (p: Profile) => string | null;
}

const FIELDS: Record<EditableProfileField, FieldConfig> = {
  name: {
    title: 'Nama',
    rule: 'Namamu hanya bisa diubah 7 hari sekali.',
    placeholder: 'Nama lengkap',
    keyboardType: 'default',
    autoCapitalize: 'words',
    maxLength: 100,
    optional: false,
    initialValue: (p) => p.fullName,
    lockedUntil: (p) => p.fullNameChangeAvailableAt,
  },
  username: {
    title: 'Nama Pengguna',
    rule: 'Nama pengguna hanya bisa diubah 30 hari sekali. Gunakan 3-30 huruf kecil, angka, atau garis bawah.',
    placeholder: 'namapengguna',
    keyboardType: 'default',
    autoCapitalize: 'none',
    maxLength: 30,
    optional: false,
    initialValue: (p) => p.username,
    lockedUntil: (p) => p.usernameChangeAvailableAt,
  },
  phone: {
    title: 'No Handphone',
    rule: 'Gunakan nomor aktif, diawali 08 atau +62.',
    placeholder: '08xxxxxxxxxx',
    keyboardType: 'phone-pad',
    autoCapitalize: 'none',
    maxLength: 20,
    optional: true,
    initialValue: (p) => p.phoneNumber ?? '',
    lockedUntil: () => null,
  },
  whatsapp: {
    title: 'No WhatsApp',
    rule: 'Nomor ini dipakai untuk konfirmasi pesanan lewat WhatsApp.',
    placeholder: '08xxxxxxxxxx',
    keyboardType: 'phone-pad',
    autoCapitalize: 'none',
    maxLength: 20,
    optional: true,
    initialValue: (p) => p.whatsappNumber ?? '',
    lockedUntil: () => null,
  },
};

const isEditableField = (value: unknown): value is EditableProfileField =>
  typeof value === 'string' && value in FIELDS;

export default function ProfileEditScreen() {
  const router = useRouter();
  const { theme } = useThemeContext();
  const { field } = useLocalSearchParams<{ field?: string }>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: profile, isLoading } = useProfile();

  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile-detail');
    }
  };

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }
  if (!isEditableField(field)) {
    return <Redirect href="/profile-detail" />;
  }

  if (!profile) {
    return (
      <ThemedView style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        {isLoading ? <ActivityIndicator size="large" color={theme.primary} /> : null}
      </ThemedView>
    );
  }

  // key: form baru bila field berganti, nilai awal diambil sekali dari profil
  return <EditForm key={field} field={field} profile={profile} onDone={close} />;
}

interface EditFormProps {
  field: EditableProfileField;
  profile: Profile;
  onDone: () => void;
}

const EditForm: React.FC<EditFormProps> = ({ field, profile, onDone }) => {
  const { theme, isDark } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { width } = useCustomerLayout();
  const isDesktop = width > 768;

  const config = FIELDS[field];
  const initialValue = config.initialValue(profile);
  const lockedUntil = config.lockedUntil(profile);

  const [value, setValue] = useState(initialValue);
  const [errorMessage, setErrorMessage] = useState('');

  const updateFullName = useUpdateFullName();
  const updateUsername = useUpdateUsername();
  const updateContact = useUpdateContact();
  const isSaving = updateFullName.isPending || updateUsername.isPending || updateContact.isPending;

  const trimmed = value.trim();
  const isChanged = trimmed !== initialValue.trim();
  const canSave = !lockedUntil && !isSaving && isChanged && (config.optional || trimmed.length > 0);

  const handleSave = async () => {
    if (!canSave) return;
    setErrorMessage('');
    try {
      if (field === 'name') {
        await updateFullName.mutateAsync(trimmed);
      } else if (field === 'username') {
        await updateUsername.mutateAsync(trimmed);
      } else {
        await updateContact.mutateAsync({
          phoneNumber: field === 'phone' ? trimmed || null : profile.phoneNumber,
          whatsappNumber: field === 'whatsapp' ? trimmed || null : profile.whatsappNumber,
        });
      }
      onDone();
    } catch (error) {
      setErrorMessage(profileErrorMessage(error));
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: isDark ? theme.background : '#FFFFFF' }]}>
      <View
        style={[
          styles.content,
          { paddingTop: insets.top > 0 ? insets.top + 12 : 20, maxWidth: isDesktop ? 600 : '100%' },
        ]}
      >
        {/* Batal | Simpan */}
        <View style={styles.topBar}>
          <Pressable
            onPress={onDone}
            accessibilityRole="button"
            hitSlop={10}
            style={({ pressed }) => [styles.clickable, pressed && styles.pressed]}
          >
            <ThemedText style={[styles.topAction, { color: Brand.red }]}>Batal</ThemedText>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave }}
            hitSlop={10}
            style={({ pressed }) => [canSave && styles.clickable, pressed && styles.pressed]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <ThemedText
                style={[
                  styles.topAction,
                  styles.saveText,
                  { color: canSave ? theme.primary : theme.textSecondary },
                ]}
              >
                Simpan
              </ThemedText>
            )}
          </Pressable>
        </View>

        <ThemedText style={[styles.title, { color: theme.text }]}>{config.title}</ThemedText>
        <ThemedText style={[styles.rule, { color: theme.textSecondary }]}>
          {lockedUntil
            ? `${config.rule} Kamu bisa mengubahnya lagi pada ${formatChangeDate(lockedUntil)}.`
            : config.rule}
        </ThemedText>

        <View
          style={[
            styles.inputPill,
            { backgroundColor: theme.backgroundElement },
            lockedUntil && styles.inputLocked,
          ]}
        >
          {field === 'username' ? (
            <ThemedText style={[styles.prefix, { color: theme.textSecondary }]}>@</ThemedText>
          ) : null}
          <TextInput
            value={value}
            onChangeText={(text) => {
              setValue(field === 'username' ? text.replace(/^@/, '').toLowerCase() : text);
              setErrorMessage('');
            }}
            editable={!lockedUntil && !isSaving}
            placeholder={config.placeholder}
            placeholderTextColor={theme.textSecondary}
            keyboardType={config.keyboardType}
            autoCapitalize={config.autoCapitalize}
            autoCorrect={false}
            autoFocus={!lockedUntil}
            maxLength={config.maxLength}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            accessibilityLabel={config.title}
            style={[styles.input, { color: theme.text }]}
          />
          {value.length > 0 && !lockedUntil ? (
            <Pressable
              onPress={() => setValue('')}
              accessibilityRole="button"
              accessibilityLabel={`Kosongkan ${config.title}`}
              style={({ pressed }) => [
                styles.clearButton,
                { backgroundColor: isDark ? '#2A2A2E' : '#FFFFFF' },
                styles.clickable,
                pressed && styles.pressed,
              ]}
            >
              {Platform.OS === 'web' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.text}
                  strokeWidth="2.6" strokeLinecap="round" aria-hidden>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <ThemedText style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>✕</ThemedText>
              )}
            </Pressable>
          ) : null}
        </View>

        {errorMessage ? <ThemedText style={styles.errorText}>{errorMessage}</ThemedText> : null}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 32,
    marginBottom: 36,
  },
  topAction: {
    fontSize: 17,
    fontWeight: '500',
  },
  saveText: {
    fontWeight: '700',
  },
  title: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  rule: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  inputPill: {
    marginTop: 22,
    minHeight: 60,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 10,
  },
  inputLocked: {
    opacity: 0.6,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 16,
    outlineStyle: 'none',
  } as object,
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    color: Brand.red,
  },
  clickable: Platform.select({ web: { cursor: 'pointer' } as object, default: {} }) as object,
  pressed: {
    opacity: 0.7,
  },
});
