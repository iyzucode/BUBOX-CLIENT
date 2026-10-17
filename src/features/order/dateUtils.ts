export const INDONESIAN_DAY_NAMES = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export const INDONESIAN_SHORT_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const INDONESIAN_MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const INDONESIAN_SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export function toDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatIndonesianDate(d: Date): string {
  const dayName = INDONESIAN_DAY_NAMES[d.getDay()];
  const dateNum = d.getDate();
  const monthName = INDONESIAN_MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${dateNum} ${monthName} ${year}`;
}

export function formatChipDate(d: Date): string {
  const shortDay = INDONESIAN_SHORT_DAYS[d.getDay()];
  const dateNum = d.getDate();
  const shortMonth = INDONESIAN_SHORT_MONTHS[d.getMonth()];
  return `${shortDay}, ${dateNum} ${shortMonth}`;
}

export function getDayOfWeekNumber(d: Date): number {
  const day = d.getDay();
  // Map JS Sunday (0) to 7, Monday (1) to 1 ... Saturday (6) to 6
  return day === 0 ? 7 : day;
}

export function nextNDays(count: number, baseDate: Date = new Date()): string[] {
  const keys: string[] = [];
  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    keys.push(toDateKey(d));
  }
  return keys;
}
