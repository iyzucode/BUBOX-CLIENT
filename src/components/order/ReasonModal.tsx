import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

interface ReasonModalProps {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (reason: string) => void;
}

/** Modal input alasan (force majeure / pembatalan admin). Alasan wajib diisi. */
export const ReasonModal: React.FC<ReasonModalProps> = (props) => (
  <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onCancel}>
    {/* Form di-mount ulang setiap modal dibuka, sehingga input selalu kosong */}
    {props.visible ? <ReasonForm {...props} /> : null}
  </Modal>
);

const ReasonForm: React.FC<ReasonModalProps> = ({
  title,
  description,
  confirmLabel = 'Kirim',
  isSubmitting = false,
  onCancel,
  onSubmit,
}) => {
  const theme = useTheme();
  const [reason, setReason] = useState('');

  const canSubmit = reason.trim().length >= 3 && !isSubmitting;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText style={[styles.title, { color: theme.text }]}>{title}</ThemedText>
          {description ? (
            <ThemedText style={[styles.desc, { color: theme.textSecondary }]}>{description}</ThemedText>
          ) : null}
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Alasan…"
            placeholderTextColor={theme.textSecondary}
            multiline
            maxLength={500}
            autoFocus
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement },
            ]}
          />
          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={[styles.btn, { borderColor: theme.border }]}>
              <ThemedText style={[styles.btnText, { color: theme.text }]}>Batal</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => canSubmit && onSubmit(reason.trim())}
              disabled={!canSubmit}
              style={[styles.btn, styles.btnDanger, { backgroundColor: theme.danger, opacity: canSubmit ? 1 : 0.5 }]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText style={[styles.btnText, { color: '#FFFFFF' }]}>{confirmLabel}</ThemedText>
              )}
            </Pressable>
          </View>
        </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: { width: '100%', maxWidth: 420, borderRadius: 18, borderWidth: 1, padding: 18, gap: 10 },
  title: { fontSize: 16, fontWeight: '700' },
  desc: { fontSize: 13 },
  input: {
    minHeight: 84,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  btn: {
    minWidth: 96,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  btnDanger: { borderWidth: 0 },
  btnText: { fontSize: 14, fontWeight: '700' },
});
