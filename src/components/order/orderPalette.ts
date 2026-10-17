import { useThemeContext } from '@/context/ThemeContext';

export interface OrderPalette {
  // Page background
  pageBg: string;

  // Hero header
  heroOverlay: string;
  heroTitle: string;
  closeBtnBg: string;
  closeBtnIcon: string;

  // Configuration outer panel
  panelBg: string;

  // Inner configuration cards (Tanggal pemesanan, Kategori menu)
  cardBg: string;
  cardTitle: string;
  iconBoxBg: string;
  iconColor: string;

  // Chips inside Tanggal pemesanan
  summaryChipText: string;
  dateChipBg: string;
  dateChipText: string;

  // Action buttons inside cards (Pilih tanggal, Kategori items)
  buttonBg: string;
  buttonText: string;
  buttonActiveBg: string;
  buttonActiveText: string;

  // Per-day menu cards
  dayHeaderBg: string;
  dayHeaderText: string;
  dayActionBtnBg: string;
  dayActionBtnIcon: string;
  dayBodyBg: string;
  dayMenuText: string;
  dayMenuSubtext: string;
  dashedDivider: string;
  priceText: string;

  // Stepper controls (+, -, input)
  stepperBorder: string;
  stepperBg: string;
  stepperText: string;
  stepperActiveBorder: string;
  stepperActiveBg: string;
  stepperActiveText: string;

  // Sticky checkout footer
  checkoutBarBg: string;
  checkoutBarBorder: string;
  checkoutSubtext: string;
  checkoutTotalText: string;
  checkoutBtnBg: string;
  checkoutBtnText: string;
  checkoutBtnDisabledBg: string;
  checkoutBtnDisabledText: string;
}

export const OrderPalettes: { light: OrderPalette; dark: OrderPalette } = {
  light: {
    pageBg: '#F8F9FA',

    heroOverlay: 'linear-gradient(180deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.15) 60%, rgba(0, 0, 0, 0.55) 100%)',
    heroTitle: '#FFFFFF',
    closeBtnBg: '#FFFFFF',
    closeBtnIcon: '#111827',

    panelBg: '#6B7280', // Dark grey outer panel from design

    cardBg: '#D1D5DB', // Mid-light grey card from design
    cardTitle: '#111827',
    iconBoxBg: '#4B5563',
    iconColor: '#F3F4F6',

    summaryChipText: '#111827',
    dateChipBg: '#9CA3AF',
    dateChipText: '#111827',

    buttonBg: '#9CA3AF',
    buttonText: '#111827',
    buttonActiveBg: '#F97316', // Brand orange accent on selection
    buttonActiveText: '#FFFFFF',

    dayHeaderBg: '#D1D5DB',
    dayHeaderText: '#111827',
    dayActionBtnBg: '#9CA3AF',
    dayActionBtnIcon: '#111827',
    dayBodyBg: '#E5E7EB', // Clean parameterized neutral grey for card body
    dayMenuText: '#111827',
    dayMenuSubtext: '#4B5563',
    dashedDivider: '#9CA3AF',
    priceText: '#111827',

    stepperBorder: '#9CA3AF',
    stepperBg: '#F3F4F6',
    stepperText: '#111827',
    stepperActiveBorder: '#F97316',
    stepperActiveBg: '#FFF0E8',
    stepperActiveText: '#EA580C',

    checkoutBarBg: '#FFFFFF',
    checkoutBarBorder: '#E5E7EB',
    checkoutSubtext: '#64748B',
    checkoutTotalText: '#111827',
    checkoutBtnBg: '#F97316',
    checkoutBtnText: '#FFFFFF',
    checkoutBtnDisabledBg: '#CBD5E1',
    checkoutBtnDisabledText: '#94A3B8',
  },
  dark: {
    pageBg: '#0B0F17',

    heroOverlay: 'linear-gradient(180deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.35) 60%, rgba(0, 0, 0, 0.75) 100%)',
    heroTitle: '#FFFFFF',
    closeBtnBg: '#1F2937',
    closeBtnIcon: '#F9FAFB',

    panelBg: '#27272A',

    cardBg: '#3F3F46',
    cardTitle: '#F4F4F5',
    iconBoxBg: '#18181B',
    iconColor: '#E4E4E7',

    summaryChipText: '#F4F4F5',
    dateChipBg: '#52525B',
    dateChipText: '#F4F4F5',

    buttonBg: '#52525B',
    buttonText: '#F4F4F5',
    buttonActiveBg: '#F97316',
    buttonActiveText: '#FFFFFF',

    dayHeaderBg: '#3F3F46',
    dayHeaderText: '#F4F4F5',
    dayActionBtnBg: '#52525B',
    dayActionBtnIcon: '#F4F4F5',
    dayBodyBg: '#27272A',
    dayMenuText: '#F4F4F5',
    dayMenuSubtext: '#A1A1AA',
    dashedDivider: '#52525B',
    priceText: '#F4F4F5',

    stepperBorder: '#52525B',
    stepperBg: '#18181B',
    stepperText: '#F4F4F5',
    stepperActiveBorder: '#F97316',
    stepperActiveBg: '#3D2214',
    stepperActiveText: '#FB923C',

    checkoutBarBg: '#111722',
    checkoutBarBorder: 'rgba(255, 255, 255, 0.08)',
    checkoutSubtext: '#94A3B8',
    checkoutTotalText: '#F8FAFC',
    checkoutBtnBg: '#F97316',
    checkoutBtnText: '#FFFFFF',
    checkoutBtnDisabledBg: '#334155',
    checkoutBtnDisabledText: '#64748B',
  },
};

export function useOrderPalette(): OrderPalette {
  const { isDark } = useThemeContext();
  return isDark ? OrderPalettes.dark : OrderPalettes.light;
}
