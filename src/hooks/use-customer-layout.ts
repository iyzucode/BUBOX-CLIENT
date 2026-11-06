import { useWindowDimensions } from 'react-native';

/**
 * Lebar maksimum layar customer. Di layar lebar (desktop), layar customer tampil sebagai
 * satu kolom 768px di tengah tanpa sidebar (lihat src/app/_layout.tsx).
 * Tampilan desktop penuh hanya untuk area admin.
 */
export const CUSTOMER_MAX_WIDTH = 768;

/**
 * Pengganti useWindowDimensions() untuk layar customer: lebar dibatasi ke kolom customer,
 * sehingga layar customer selalu memakai layout mobile walau jendela browser lebih lebar.
 */
export function useCustomerLayout() {
  const { width, height } = useWindowDimensions();
  return {
    width: Math.min(width, CUSTOMER_MAX_WIDTH),
    height,
    /** Jendela lebih lebar dari kolom customer (ada area kosong di kiri-kanan). */
    isWideWindow: width > CUSTOMER_MAX_WIDTH,
  };
}
