# Frontend Development Guide & AI Context
**Path**: `/Client`
**Tech Stack**: React Native (Expo), TypeScript, Web Support Enabled
**Routing/Navigation**: Expo Router (File-based routing)
**State Management**: Zustand (Client State), TanStack Query / React Query (Server State/API Cache)
**API Client**: Axios

## 1. Core Principles & Vibe Coding Rules
Sebagai AI Assistant, Anda HARUS mematuhi aturan berikut saat meng-generate kode di proyek ini:
- **STRICTLY TypeScript**: Dilarang menggunakan tipe `any`. Semua Props, State, dan API Responses harus memiliki interface/type yang terdefinisi dengan jelas.
- **Cross-Platform Readiness**: Setiap komponen UI harus diuji pemikirannya untuk berjalan di layar Mobile (sentuhan) dan Web (klik/mouse). Gunakan `Platform.OS` jika ada implementasi yang spesifik untuk Web atau Mobile.
- **Component Pattern**: 
  - Wajib menggunakan Functional Components dan React Hooks.
  - Hindari komponen yang terlalu besar; pecah menjadi *sub-components* yang lebih kecil dan *reusable*.
- **Data Fetching**: Jangan melakukan fetch API manual dengan `useEffect`. Selalu gunakan custom hooks berbasis **TanStack Query (React Query)** untuk mengelola *caching*, *loading state*, dan *error handling* dari endpoint `/Server`.
- **Styling**: Gunakan `StyleSheet.create` bawaan React Native atau framework utility (seperti NativeWind jika sudah di-setup) yang aman untuk *cross-platform*.

## 2. Struktur Direktori (Feature-Based Architecture)
Proyek ini menggunakan pemisahan berdasarkan fitur untuk kemudahan skalabilitas:

/Client
├── /app                  # (Wajib dari Expo Router) Berisi struktur routing halaman & layout
├── /src
│   ├── /components       # Komponen UI global & reusable (Button, Input, Card, Modal)
│   ├── /features         # Logika spesifik per modul (contoh: /features/auth, /features/dashboard)
│   ├── /hooks            # Custom React Hooks global (contoh: useDebounce, useTheme)
│   ├── /services         # Konfigurasi Axios instance (api.ts) dan interceptors
│   ├── /store            # Global state management menggunakan Zustand
│   ├── /types            # Global TypeScript definitions/interfaces
│   └── /utils            # Helper functions, formatter (tanggal, mata uang), konstanta
├── .env                  # Environment variables (EXPO_PUBLIC_API_URL)
├── app.json              # Konfigurasi aplikasi Expo (nama, icon, splash screen)
└── development_guide.md

## 3. Standard Patterns

### API Client (Axios Setup)
Semua panggilan API harus melewati instance Axios ini agar memiliki interceptor (misal untuk menyematkan Bearer Token).
```typescript
// src/services/api.ts
import axios from 'axios';

export const api = axios.create({
  // EXPO_PUBLIC_ prefix wajib agar terbaca oleh Expo
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// src/features/users/useUsers.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export const useGetUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });
};

// src/store/useAuthStore.ts
import { create } from 'zustand';

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
  logout: () => set({ token: null }),
}));
```

## 4. Pedoman Desain UI/UX: Icon & Simbol over Verbose Text
Patuhi prinsip kesederhanaan visual (*simplicity & minimalism*) dalam merancang antarmuka pengguna:
- **Prioritaskan Simbol & Ikon**: Usahakan penggunaan simbol, ikon grafis, atau representasi visual intuitif daripada teks deskriptif panjang atau label tombol yang bertele-tele (misal: panah kembali `←`, kalender `📅`, expand/collapse `▾`/`▴` atau `⤢`/`⤡`, tambah `+`, hapus `✕`).
- **Minimalist & Clean (Bebas Text Clutter)**: Hindari paragraf petunjuk panjang yang memenuhi layar. UI harus jelas fungsi dan alurnya dari affordance elemen visual, bukan dari membaca paragraf penjelasan.
- **Informasi Status & Tanggal yang Ringkas**: Tampilkan rentang waktu atau status secara padat dan mudah dipindai (*scannable*) menggunakan ikon dan format singkat (contoh: `🗓️ 23 Sep – 22 Okt` daripada penulisan nama hari lengkap yang memakan banyak baris).
- **Aksi Cepat Intuitif**: Tombol kontrol ringkas (seperti buka/tutup rincian atau hapus item) menggunakan kombinasi simbol/ikon minimalis.