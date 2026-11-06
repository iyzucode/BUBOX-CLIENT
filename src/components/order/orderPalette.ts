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
  checkoutGlassBg: string;
  checkoutGlassBorder: string;
  checkoutSubtext: string;
  checkoutTotalText: string;
  checkoutBtnBg: string;
  checkoutBtnText: string;
  checkoutBtnDisabledBg: string;
  checkoutBtnDisabledText: string;
}

export const OrderPalettes: { light: OrderPalette; dark: OrderPalette } = {
  light: {
    pageBg: '#FFF7F5',

    heroOverlay: 'linear-gradient(180deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.15) 60%, rgba(0, 0, 0, 0.55) 100%)',
    heroTitle: '#FFFFFF',
    closeBtnBg: '#FFFFFF',
    closeBtnIcon: '#113366',

    panelBg: '#113366',

    cardBg: '#FFFFFF',
    cardTitle: '#113366',
    iconBoxBg: '#EE4D2D',
    iconColor: '#FFFFFF',

    summaryChipText: '#113366',
    dateChipBg: '#FDE8E3',
    dateChipText: '#D0011B',

    buttonBg: '#FDEEEA',
    buttonText: '#113366',
    buttonActiveBg: '#EE4D2D',
    buttonActiveText: '#FFFFFF',

    dayHeaderBg: '#FDE8E3',
    dayHeaderText: '#113366',
    dayActionBtnBg: '#FFFFFF',
    dayActionBtnIcon: '#113366',
    dayBodyBg: '#FFFFFF',
    dayMenuText: '#113366',
    dayMenuSubtext: '#5A6B86',
    dashedDivider: '#F2DCD5',
    priceText: '#113366',

    stepperBorder: '#F2C4B8',
    stepperBg: '#FFFFFF',
    stepperText: '#113366',
    stepperActiveBorder: '#EE4D2D',
    stepperActiveBg: '#FDE8E3',
    stepperActiveText: '#D0011B',

    checkoutBarBg: '#FFFFFF',
    checkoutBarBorder: '#F2DCD5',
    checkoutGlassBg: 'rgba(255, 255, 255, 0.72)',
    checkoutGlassBorder: 'rgba(17, 51, 102, 0.10)',
    checkoutSubtext: '#5A6B86',
    checkoutTotalText: '#113366',
    checkoutBtnBg: '#EE4D2D',
    checkoutBtnText: '#FFFFFF',
    checkoutBtnDisabledBg: '#F2DCD5',
    checkoutBtnDisabledText: '#B48F86',
  },
  dark: {
    pageBg: '#0A0A0A',

    heroOverlay: 'linear-gradient(180deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.35) 60%, rgba(0, 0, 0, 0.75) 100%)',
    heroTitle: '#FFFFFF',
    closeBtnBg: '#18181B',
    closeBtnIcon: '#F4F4F5',

    panelBg: '#18181B',

    cardBg: '#232326',
    cardTitle: '#F4F4F5',
    iconBoxBg: '#EE4D2D',
    iconColor: '#FFFFFF',

    summaryChipText: '#F4F4F5',
    dateChipBg: '#2E1610',
    dateChipText: '#FF8A70',

    buttonBg: '#2E2E33',
    buttonText: '#F4F4F5',
    buttonActiveBg: '#EE4D2D',
    buttonActiveText: '#FFFFFF',

    dayHeaderBg: '#232326',
    dayHeaderText: '#F4F4F5',
    dayActionBtnBg: '#2E2E33',
    dayActionBtnIcon: '#F4F4F5',
    dayBodyBg: '#18181B',
    dayMenuText: '#F4F4F5',
    dayMenuSubtext: '#A1A1AA',
    dashedDivider: '#2E2E33',
    priceText: '#F4F4F5',

    stepperBorder: '#3F3F46',
    stepperBg: '#0A0A0A',
    stepperText: '#F4F4F5',
    stepperActiveBorder: '#EE4D2D',
    stepperActiveBg: '#2E1610',
    stepperActiveText: '#FF8A70',

    checkoutBarBg: '#141416',
    checkoutBarBorder: 'rgba(255, 255, 255, 0.08)',
    checkoutGlassBg: 'rgba(24, 24, 27, 0.72)',
    checkoutGlassBorder: 'rgba(255, 255, 255, 0.12)',
    checkoutSubtext: '#A1A1AA',
    checkoutTotalText: '#F4F4F5',
    checkoutBtnBg: '#EE4D2D',
    checkoutBtnText: '#FFFFFF',
    checkoutBtnDisabledBg: '#2E2E33',
    checkoutBtnDisabledText: '#71717A',
  },
};

export function useOrderPalette(): OrderPalette {
  const { isDark } = useThemeContext();
  return isDark ? OrderPalettes.dark : OrderPalettes.light;
}
