import { create } from 'zustand';

/**
 * Jenis dialog:
 *   info / success / warning / error → ikon & warna untuk pemberitahuan
 *   danger → konfirmasi tindakan yang merusak (hapus, batalkan); tombol utama merah
 */
export type DialogTone = 'info' | 'success' | 'warning' | 'error' | 'danger';

export interface DialogRequest {
  id: number;
  kind: 'alert' | 'confirm';
  title: string;
  message?: string;
  tone: DialogTone;
  confirmText: string;
  cancelText: string;
  resolve: (confirmed: boolean) => void;
}

interface DialogStoreState {
  /** Antrean dialog; yang tampil hanya elemen pertama. */
  queue: DialogRequest[];
  push: (request: Omit<DialogRequest, 'id'>) => void;
  /** Tutup dialog yang sedang tampil dan kirim hasilnya ke pemanggil. */
  close: (confirmed: boolean) => void;
}

let nextId = 1;

export const useDialogStore = create<DialogStoreState>((set, get) => ({
  queue: [],
  push: (request) => set((state) => ({ queue: [...state.queue, { ...request, id: nextId++ }] })),
  close: (confirmed) => {
    const [current, ...rest] = get().queue;
    if (!current) return;
    set({ queue: rest });
    current.resolve(confirmed);
  },
}));
