import { Alert, Platform } from 'react-native';

/** Alert lintas platform (Alert.alert tidak tampil di react-native-web). */
export function showAlert(title: string, message: string): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

/** Konfirmasi lintas platform. Resolve true bila pengguna menyetujui. */
export function confirmAction(title: string, message: string, confirmLabel = 'Ya'): Promise<boolean> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Batal', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
