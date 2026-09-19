import type { Dhikr } from '@/types';

export const DEFAULT_DHIKR: readonly Dhikr[] = [
  { id: 'subhanallah', name: 'SubhanAllah', arabic: 'سُبْحَانَ اللَّهِ', isCustom: false },
  { id: 'alhamdulillah', name: 'Alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', isCustom: false },
  { id: 'allahu-akbar', name: 'Allahu Akbar', arabic: 'اللَّهُ أَكْبَرُ', isCustom: false },
  { id: 'astaghfirullah', name: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ', isCustom: false },
  { id: 'la-ilaha-illallah', name: 'La ilaha illallah', arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ', isCustom: false },
  {
    id: 'salawat',
    name: 'Allahumma salli ala Muhammad',
    arabic: 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ',
    isCustom: false,
  },
];

export const DEFAULT_DHIKR_ID = 'subhanallah';

export const MAX_DHIKR_NAME_LENGTH = 60;
export const MAX_CUSTOM_DHIKR = 50;
