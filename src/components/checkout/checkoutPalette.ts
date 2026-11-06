import { useThemeContext } from '@/context/ThemeContext';

export interface CheckoutPalette {
  pageBg: string;
  headerBg: string;
  headerText: string;
  backBtnBg: string;
  backBtnIcon: string;

  // Major section cards
  cardBg: string;
  cardBorder: string;
  cardTitle: string;
  cardSubtext: string;

  // Option selection pills (Pesan Antar vs Ambil Sendiri)
  optionBg: string;
  optionBorder: string;
  optionActiveBg: string;
  optionActiveBorder: string;
  optionText: string;
  optionSubtext: string;
  optionIconColor: string;

  // Nested address & outlet box
  nestedBoxBg: string;
  nestedBoxBorder: string;
  actionPillBtnBg: string;
  actionPillBtnText: string;

  // Segmented control (Hari | Kategori)
  segmentedBg: string;
  segmentedActiveBg: string;
  segmentedText: string;
  segmentedActiveText: string;
  segmentedLabel: string;

  // Input fields (Promo coupon)
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;

  // Line dividers
  dividerColor: string;

  // Financial row breakdown
  financeLabel: string;
  financeValue: string;
  financeTotal: string;

  // Sticky bottom footer
  footerBg: string;
  footerBorder: string;
  footerGlassBg: string;
  footerGlassBorder: string;
  footerTotalLabel: string;
  footerTotalAmount: string;
  payBtnBg: string;
  payBtnText: string;
}

export const CheckoutPalettes: { light: CheckoutPalette; dark: CheckoutPalette } = {
  light: {
    pageBg: '#FFF7F5',
    headerBg: '#113366',
    headerText: '#FFFFFF',
    backBtnBg: '#FFFFFF',
    backBtnIcon: '#113366',

    // Section cards matching wireframe
    cardBg: '#FFFFFF',
    cardBorder: '#F2DCD5',
    cardTitle: '#113366',
    cardSubtext: '#5A6B86',

    // Option pills
    optionBg: '#FFF7F5',
    optionBorder: '#F2DCD5',
    optionActiveBg: '#FDE8E3',
    optionActiveBorder: '#EE4D2D',
    optionText: '#113366',
    optionSubtext: '#5A6B86',
    optionIconColor: '#EE4D2D',

    // Nested address/outlet box
    nestedBoxBg: '#E7ECF5',
    nestedBoxBorder: 'transparent',
    actionPillBtnBg: '#113366',
    actionPillBtnText: '#FFFFFF',

    // Segmented toggle
    segmentedBg: '#E7ECF5',
    segmentedActiveBg: '#113366',
    segmentedText: '#113366',
    segmentedActiveText: '#FFFFFF',
    segmentedLabel: '#5A6B86',

    // Promo input
    inputBg: '#FFF7F5',
    inputBorder: '#F2DCD5',
    inputText: '#113366',
    inputPlaceholder: '#9AA6BA',

    // Dividers
    dividerColor: '#F2DCD5',

    // Financial rows
    financeLabel: '#5A6B86',
    financeValue: '#113366',
    financeTotal: '#113366',

    // Sticky bottom
    footerBg: '#FFFFFF',
    footerBorder: '#F2DCD5',
    footerGlassBg: 'rgba(255, 255, 255, 0.72)',
    footerGlassBorder: 'rgba(17, 51, 102, 0.10)',
    footerTotalLabel: '#5A6B86',
    footerTotalAmount: '#113366',
    payBtnBg: '#EE4D2D',
    payBtnText: '#FFFFFF',
  },
  dark: {
    pageBg: '#0A0A0A',
    headerBg: '#141416',
    headerText: '#F4F4F5',
    backBtnBg: '#2E2E33',
    backBtnIcon: '#F4F4F5',

    // Section cards in dark mode
    cardBg: '#18181B',
    cardBorder: '#27272A',
    cardTitle: '#F4F4F5',
    cardSubtext: '#A1A1AA',

    // Option pills
    optionBg: '#232326',
    optionBorder: '#2E2E33',
    optionActiveBg: '#2E1610',
    optionActiveBorder: '#EE4D2D',
    optionText: '#F4F4F5',
    optionSubtext: '#A1A1AA',
    optionIconColor: '#FF8A70',

    // Nested address/outlet box
    nestedBoxBg: '#232326',
    nestedBoxBorder: '#2E2E33',
    actionPillBtnBg: '#3F3F46',
    actionPillBtnText: '#F4F4F5',

    // Segmented toggle
    segmentedBg: '#27272A',
    segmentedActiveBg: '#EE4D2D',
    segmentedText: '#A1A1AA',
    segmentedActiveText: '#FFFFFF',
    segmentedLabel: '#A1A1AA',

    // Promo input
    inputBg: '#232326',
    inputBorder: '#3F3F46',
    inputText: '#F4F4F5',
    inputPlaceholder: '#71717A',

    // Dividers
    dividerColor: '#27272A',

    // Financial rows
    financeLabel: '#A1A1AA',
    financeValue: '#F4F4F5',
    financeTotal: '#F4F4F5',

    // Sticky bottom
    footerBg: '#141416',
    footerBorder: '#27272A',
    footerGlassBg: 'rgba(24, 24, 27, 0.72)',
    footerGlassBorder: 'rgba(255, 255, 255, 0.12)',
    footerTotalLabel: '#A1A1AA',
    footerTotalAmount: '#F4F4F5',
    payBtnBg: '#EE4D2D',
    payBtnText: '#FFFFFF',
  },
};

export function useCheckoutPalette(): CheckoutPalette {
  const { isDark } = useThemeContext();
  return isDark ? CheckoutPalettes.dark : CheckoutPalettes.light;
}
