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
  footerTotalLabel: string;
  footerTotalAmount: string;
  payBtnBg: string;
  payBtnText: string;
}

export const CheckoutPalettes: { light: CheckoutPalette; dark: CheckoutPalette } = {
  light: {
    pageBg: '#EFEFEF',
    headerBg: '#6B7280',
    headerText: '#FFFFFF',
    backBtnBg: '#FFFFFF',
    backBtnIcon: '#111827',

    // Section cards matching wireframe
    cardBg: '#D8D8D8',
    cardBorder: 'transparent',
    cardTitle: '#111827',
    cardSubtext: '#4B5563',

    // Option pills
    optionBg: '#BDBDBD',
    optionBorder: 'transparent',
    optionActiveBg: '#9E9E9E',
    optionActiveBorder: '#616161',
    optionText: '#111827',
    optionSubtext: '#424242',
    optionIconColor: '#111827',

    // Nested address/outlet box
    nestedBoxBg: '#B0B0B0',
    nestedBoxBorder: 'transparent',
    actionPillBtnBg: '#616161',
    actionPillBtnText: '#FFFFFF',

    // Segmented toggle
    segmentedBg: '#9E9E9E',
    segmentedActiveBg: '#757575',
    segmentedText: '#212121',
    segmentedActiveText: '#FFFFFF',
    segmentedLabel: '#FFFFFF',

    // Promo input
    inputBg: '#9E9E9E',
    inputBorder: 'transparent',
    inputText: '#111827',
    inputPlaceholder: '#424242',

    // Dividers
    dividerColor: '#BDBDBD',

    // Financial rows
    financeLabel: '#424242',
    financeValue: '#111827',
    financeTotal: '#111827',

    // Sticky bottom
    footerBg: '#D8D8D8',
    footerBorder: '#BDBDBD',
    footerTotalLabel: '#616161',
    footerTotalAmount: '#111827',
    payBtnBg: '#9E9E9E',
    payBtnText: '#111827',
  },
  dark: {
    pageBg: '#0F172A',
    headerBg: '#1E293B',
    headerText: '#F8FAFC',
    backBtnBg: '#334155',
    backBtnIcon: '#F8FAFC',

    // Section cards in dark mode
    cardBg: '#1E293B',
    cardBorder: '#334155',
    cardTitle: '#F8FAFC',
    cardSubtext: '#94A3B8',

    // Option pills
    optionBg: '#273549',
    optionBorder: '#334155',
    optionActiveBg: '#334155',
    optionActiveBorder: '#F59E0B',
    optionText: '#F8FAFC',
    optionSubtext: '#94A3B8',
    optionIconColor: '#F8FAFC',

    // Nested address/outlet box
    nestedBoxBg: '#273549',
    nestedBoxBorder: '#334155',
    actionPillBtnBg: '#475569',
    actionPillBtnText: '#F8FAFC',

    // Segmented toggle
    segmentedBg: '#334155',
    segmentedActiveBg: '#475569',
    segmentedText: '#94A3B8',
    segmentedActiveText: '#F8FAFC',
    segmentedLabel: '#94A3B8',

    // Promo input
    inputBg: '#334155',
    inputBorder: '#475569',
    inputText: '#F8FAFC',
    inputPlaceholder: '#64748B',

    // Dividers
    dividerColor: '#334155',

    // Financial rows
    financeLabel: '#94A3B8',
    financeValue: '#F8FAFC',
    financeTotal: '#F8FAFC',

    // Sticky bottom
    footerBg: '#1E293B',
    footerBorder: '#334155',
    footerTotalLabel: '#94A3B8',
    footerTotalAmount: '#F8FAFC',
    payBtnBg: '#334155',
    payBtnText: '#F8FAFC',
  },
};

export function useCheckoutPalette(): CheckoutPalette {
  const { isDark } = useThemeContext();
  return isDark ? CheckoutPalettes.dark : CheckoutPalettes.light;
}
