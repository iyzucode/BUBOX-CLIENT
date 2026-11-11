import { useDialogStore, type DialogTone } from '@/store/useDialogStore';

export type { DialogTone } from '@/store/useDialogStore';

export interface AlertOptions {
  /** Default 'info'. */
  tone?: Exclude<DialogTone, 'danger'>;
  /** Teks tombol. Default 'Oke'. */
  buttonText?: string;
}

export interface ConfirmOptions {
  /** Teks tombol setuju. Default 'Ya'. */
  confirmText?: string;
  /** Teks tombol batal. Default 'Batal'. */
  cancelText?: string;
  /** Default 'danger' (tombol merah). Pakai 'info' untuk konfirmasi yang tidak merusak. */
  tone?: DialogTone;
}

/**
 * Pop-up pemberitahuan bertema LUANNA, sama di web, Android, dan iOS.
 * Resolve setelah pengguna menutupnya. Dialog ditampilkan oleh <AppDialogHost /> di root layout.
 */
export function showAlert(title: string, message?: string, options: AlertOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    useDialogStore.getState().push({
      kind: 'alert',
      title,
      message,
      tone: options.tone ?? 'info',
      confirmText: options.buttonText ?? 'Oke',
      cancelText: '',
      resolve: () => resolve(),
    });
  });
}

/** Pop-up konfirmasi. Resolve true bila pengguna menyetujui; false bila batal atau ditutup. */
export function confirmAction(
  title: string,
  message?: string,
  options: ConfirmOptions | string = {}
): Promise<boolean> {
  const opts: ConfirmOptions = typeof options === 'string' ? { confirmText: options } : options;
  return new Promise((resolve) => {
    useDialogStore.getState().push({
      kind: 'confirm',
      title,
      message,
      tone: opts.tone ?? 'danger',
      confirmText: opts.confirmText ?? 'Ya',
      cancelText: opts.cancelText ?? 'Batal',
      resolve,
    });
  });
}
