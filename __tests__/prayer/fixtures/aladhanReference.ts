import type { AsrMethod, CalculationMethodId, PrayerName } from '@/types';

/*
 * Prayer times from the public AlAdhan API (api.aladhan.com), an independent
 * implementation with its own code base and its own astronomical routines.
 * The values were read once, by hand, on the date below and frozen here, so
 * the tests never touch the network and never change under us.
 *
 * Every query below asks for the same settings the app uses for that case:
 *   method                    the calculation method (AlAdhan numeric id)
 *   school                    0 standard Asr, 1 Hanafi Asr
 *   latitudeAdjustmentMethod  1 middle of the night, 2 one seventh of the night
 *   timezonestring            the zone the returned HH:mm belong to
 *   shafaq                    only for the Moonsighting Committee, "general"
 *
 * The app asks the adhan library for HighLatitudeRule.recommended, which is
 * the middle of the night up to 48 degrees and one seventh of the night above
 * it, so each case passes the matching latitudeAdjustmentMethod.
 */

/** The day the values were read from the API, as YYYY-MM-DD. */
export const REFERENCE_RETRIEVED = '2026-09-20';

/**
 * How far the app's time may sit from the reference, in minutes. The two
 * implementations round differently and use slightly different solar
 * routines, which moves a time by a minute either way.
 */
export const DEFAULT_TOLERANCE_MINUTES = 2;

export interface ReferenceCase {
  /** Short, unique id; also used in test names. */
  id: string;
  /** The place, for readable test names. */
  place: string;
  /** IANA zone the returned times belong to. */
  timeZone: string;
  latitude: number;
  longitude: number;
  /** The day, written the way the app writes day keys. */
  dayKey: string;
  /** The app settings that match the query. */
  method: CalculationMethodId;
  asrMethod: AsrMethod;
  /** The exact request these values came from. */
  query: string;
  /** Local HH:mm as the reference returned them. */
  timings: Record<PrayerName, string>;
  /**
   * Minutes the method adds in the library the app uses but not in the
   * reference. These are fixed, published offsets of the method, not a
   * disagreement about where the sun is, so they are taken off before the
   * comparison and the normal tolerance still applies. Always explained.
   */
  methodOffset?: Partial<Record<PrayerName, number>>;
  /** A wider allowance for single prayers. Always explained in `note`. */
  tolerance?: Partial<Record<PrayerName, number>>;
  note?: string;
}

export const ALADHAN_REFERENCE: readonly ReferenceCase[] = [
  {
    id: 'hyderabad-karachi-standard',
    place: 'Hyderabad',
    timeZone: 'Asia/Kolkata',
    latitude: 17.384,
    longitude: 78.4564,
    dayKey: '2026-09-20',
    method: 'Karachi',
    asrMethod: 'standard',
    query:
      'https://api.aladhan.com/v1/timings/20-09-2026?latitude=17.384&longitude=78.4564&method=1&school=0&latitudeAdjustmentMethod=1&timezonestring=Asia%2FKolkata',
    timings: {
      fajr: '04:53',
      sunrise: '06:05',
      dhuhr: '12:10',
      asr: '15:33',
      maghrib: '18:14',
      isha: '19:26',
    },
  },
  {
    id: 'hyderabad-karachi-hanafi',
    place: 'Hyderabad, Hanafi Asr',
    timeZone: 'Asia/Kolkata',
    latitude: 17.384,
    longitude: 78.4564,
    dayKey: '2026-09-20',
    method: 'Karachi',
    asrMethod: 'hanafi',
    query:
      'https://api.aladhan.com/v1/timings/20-09-2026?latitude=17.384&longitude=78.4564&method=1&school=1&latitudeAdjustmentMethod=1&timezonestring=Asia%2FKolkata',
    timings: {
      fajr: '04:53',
      sunrise: '06:05',
      dhuhr: '12:10',
      asr: '16:32',
      maghrib: '18:14',
      isha: '19:26',
    },
    note: 'The same place and day as the case above, so only Asr moves: 15:33 becomes 16:32.',
  },
  {
    id: 'karachi-karachi-hanafi',
    place: 'Karachi',
    timeZone: 'Asia/Karachi',
    latitude: 24.8607,
    longitude: 67.0011,
    dayKey: '2026-09-20',
    method: 'Karachi',
    asrMethod: 'hanafi',
    query:
      'https://api.aladhan.com/v1/timings/20-09-2026?latitude=24.8607&longitude=67.0011&method=1&school=1&latitudeAdjustmentMethod=1&timezonestring=Asia%2FKarachi',
    timings: {
      fajr: '05:04',
      sunrise: '06:20',
      dhuhr: '12:25',
      asr: '16:49',
      maghrib: '18:31',
      isha: '19:47',
    },
  },
  {
    id: 'makkah-ummalqura',
    place: 'Makkah',
    timeZone: 'Asia/Riyadh',
    latitude: 21.4225,
    longitude: 39.8262,
    dayKey: '2026-09-20',
    method: 'UmmAlQura',
    asrMethod: 'standard',
    query:
      'https://api.aladhan.com/v1/timings/20-09-2026?latitude=21.4225&longitude=39.8262&method=4&school=0&latitudeAdjustmentMethod=1&timezonestring=Asia%2FRiyadh',
    timings: {
      fajr: '04:53',
      sunrise: '06:09',
      dhuhr: '12:14',
      asr: '15:40',
      maghrib: '18:19',
      isha: '19:49',
    },
    note:
      'The day is 9 Rabi al-thani 1448, well outside Ramadan, so Isha is the usual 90 minutes ' +
      'after Maghrib rather than the 120 the reference uses during Ramadan.',
  },
  {
    id: 'cairo-egyptian',
    place: 'Cairo',
    timeZone: 'Africa/Cairo',
    latitude: 30.0444,
    longitude: 31.2357,
    dayKey: '2026-09-20',
    method: 'Egyptian',
    asrMethod: 'standard',
    query:
      'https://api.aladhan.com/v1/timings/20-09-2026?latitude=30.0444&longitude=31.2357&method=5&school=0&latitudeAdjustmentMethod=1&timezonestring=Africa%2FCairo',
    timings: {
      fajr: '05:15',
      sunrise: '06:42',
      dhuhr: '12:49',
      asr: '16:17',
      maghrib: '18:54',
      isha: '20:12',
    },
    note: 'Egypt is on summer time in September, so this also checks the zone offset is read, not assumed.',
  },
  {
    id: 'london-mwl-winter',
    place: 'London in winter time',
    timeZone: 'Europe/London',
    latitude: 51.5074,
    longitude: -0.1278,
    dayKey: '2026-10-26',
    method: 'MuslimWorldLeague',
    asrMethod: 'standard',
    query:
      'https://api.aladhan.com/v1/timings/26-10-2026?latitude=51.5074&longitude=-0.1278&method=3&school=0&latitudeAdjustmentMethod=2&timezonestring=Europe%2FLondon',
    timings: {
      fajr: '04:51',
      sunrise: '06:43',
      dhuhr: '11:44',
      asr: '14:17',
      maghrib: '16:45',
      isha: '18:31',
    },
    tolerance: { asr: 3 },
    note:
      'The first day after British Summer Time ends. Late in the year at 51.5 degrees north the ' +
      'sun stays low, so its height changes slowly through the afternoon and the small difference ' +
      'in solar declination between the two implementations moves Asr by three minutes. The other ' +
      'five times agree to within a minute.',
  },
  {
    id: 'london-mwl-summer',
    place: 'London in summer time',
    timeZone: 'Europe/London',
    latitude: 51.5074,
    longitude: -0.1278,
    dayKey: '2026-03-30',
    method: 'MuslimWorldLeague',
    asrMethod: 'standard',
    query:
      'https://api.aladhan.com/v1/timings/30-03-2026?latitude=51.5074&longitude=-0.1278&method=3&school=0&latitudeAdjustmentMethod=2&timezonestring=Europe%2FLondon',
    timings: {
      fajr: '05:05',
      sunrise: '06:41',
      dhuhr: '13:05',
      asr: '16:34',
      maghrib: '19:30',
      isha: '21:06',
    },
    note: 'The first day after British Summer Time begins, so every time jumps an hour against the day before.',
  },
  {
    id: 'london-mwl-june',
    place: 'London near midsummer',
    timeZone: 'Europe/London',
    latitude: 51.5074,
    longitude: -0.1278,
    dayKey: '2026-06-21',
    method: 'MuslimWorldLeague',
    asrMethod: 'standard',
    query:
      'https://api.aladhan.com/v1/timings/21-06-2026?latitude=51.5074&longitude=-0.1278&method=3&school=0&latitudeAdjustmentMethod=2&timezonestring=Europe%2FLondon',
    timings: {
      fajr: '03:40',
      sunrise: '04:43',
      dhuhr: '13:02',
      asr: '17:25',
      maghrib: '21:22',
      isha: '22:25',
    },
    note:
      'The shortest night of the year in London: the twilight never reaches 18 degrees, so both ' +
      'sides fall back on one seventh of the night for Fajr and Isha and still agree.',
  },
  {
    id: 'london-moonsighting-winter',
    place: 'London, Moonsighting Committee, winter time',
    timeZone: 'Europe/London',
    latitude: 51.5074,
    longitude: -0.1278,
    dayKey: '2026-10-26',
    method: 'MoonsightingCommittee',
    asrMethod: 'standard',
    query:
      'https://api.aladhan.com/v1/timings/26-10-2026?latitude=51.5074&longitude=-0.1278&method=15&school=0&latitudeAdjustmentMethod=2&timezonestring=Europe%2FLondon&shafaq=general',
    timings: {
      fajr: '05:07',
      sunrise: '06:43',
      dhuhr: '11:44',
      asr: '14:17',
      maghrib: '16:45',
      isha: '18:10',
    },
    methodOffset: { dhuhr: 5, maghrib: 3 },
    tolerance: { asr: 3 },
    note:
      'The method the app suggests in the United Kingdom, and the only one whose Fajr and Isha ' +
      'come from a seasonal rule instead of a twilight angle: both sides put them at 05:07 and ' +
      '18:10 to the minute. The method also adds five minutes to Dhuhr and three to Maghrib in ' +
      'the library the app uses, which is taken back out before comparing. Asr carries the same ' +
      'three minutes as the case above, for the same reason: a low autumn sun at 51.5 degrees north.',
  },
  {
    id: 'london-moonsighting-june',
    place: 'London, Moonsighting Committee, near midsummer',
    timeZone: 'Europe/London',
    latitude: 51.5074,
    longitude: -0.1278,
    dayKey: '2026-06-21',
    method: 'MoonsightingCommittee',
    asrMethod: 'standard',
    query:
      'https://api.aladhan.com/v1/timings/21-06-2026?latitude=51.5074&longitude=-0.1278&method=15&school=0&latitudeAdjustmentMethod=2&timezonestring=Europe%2FLondon&shafaq=general',
    timings: {
      fajr: '02:43',
      sunrise: '04:43',
      dhuhr: '13:02',
      asr: '17:25',
      maghrib: '21:22',
      isha: '22:42',
    },
    methodOffset: { dhuhr: 5, maghrib: 3 },
    note:
      'The hardest day for the seasonal rule. It puts Fajr at 02:43 and Isha at 22:42, nearly an ' +
      'hour away from what the 18 degree angle gives on the same day, and the two implementations ' +
      'still agree to the minute.',
  },
  {
    id: 'newyork-isna-march',
    place: 'New York after the spring clock change',
    timeZone: 'America/New_York',
    latitude: 40.7128,
    longitude: -74.006,
    dayKey: '2026-03-09',
    method: 'NorthAmerica',
    asrMethod: 'standard',
    query:
      'https://api.aladhan.com/v1/timings/09-03-2026?latitude=40.7128&longitude=-74.006&method=2&school=0&latitudeAdjustmentMethod=1&timezonestring=America%2FNew_York',
    timings: {
      fajr: '06:02',
      sunrise: '07:17',
      dhuhr: '13:06',
      asr: '16:22',
      maghrib: '18:56',
      isha: '20:11',
    },
    note: 'The day after daylight saving time starts in the United States.',
  },
  {
    id: 'newyork-isna-november',
    place: 'New York after the autumn clock change',
    timeZone: 'America/New_York',
    latitude: 40.7128,
    longitude: -74.006,
    dayKey: '2026-11-02',
    method: 'NorthAmerica',
    asrMethod: 'standard',
    query:
      'https://api.aladhan.com/v1/timings/02-11-2026?latitude=40.7128&longitude=-74.006&method=2&school=0&latitudeAdjustmentMethod=1&timezonestring=America%2FNew_York',
    timings: {
      fajr: '05:11',
      sunrise: '06:28',
      dhuhr: '11:40',
      asr: '14:28',
      maghrib: '16:51',
      isha: '18:08',
    },
    note: 'The day after daylight saving time ends in the United States.',
  },
  {
    id: 'jakarta-singapore',
    place: 'Jakarta',
    timeZone: 'Asia/Jakarta',
    latitude: -6.2088,
    longitude: 106.8456,
    dayKey: '2026-09-20',
    method: 'Singapore',
    asrMethod: 'standard',
    query:
      'https://api.aladhan.com/v1/timings/20-09-2026?latitude=-6.2088&longitude=106.8456&method=11&school=0&latitudeAdjustmentMethod=1&timezonestring=Asia%2FJakarta',
    timings: {
      fajr: '04:26',
      sunrise: '05:43',
      dhuhr: '11:46',
      asr: '14:57',
      maghrib: '17:49',
      isha: '18:58',
    },
    note:
      'The only case south of the equator. The Singapore method rounds every time up to the next ' +
      'whole minute in the library the app uses, which puts most times a minute after the ' +
      'reference; Dhuhr carries the method minute on top of that.',
  },
  {
    id: 'dubai-dubai',
    place: 'Dubai',
    timeZone: 'Asia/Dubai',
    latitude: 25.2048,
    longitude: 55.2708,
    dayKey: '2026-09-20',
    method: 'Dubai',
    asrMethod: 'standard',
    query:
      'https://api.aladhan.com/v1/timings/20-09-2026?latitude=25.2048&longitude=55.2708&method=16&school=0&latitudeAdjustmentMethod=1&timezonestring=Asia%2FDubai',
    timings: {
      fajr: '04:49',
      sunrise: '06:07',
      dhuhr: '12:15',
      asr: '15:40',
      maghrib: '18:21',
      isha: '19:35',
    },
    methodOffset: { sunrise: -3 },
    note:
      'The Dubai method carries fixed minute offsets. Both implementations add three minutes to ' +
      'Dhuhr, Asr and Maghrib, but only the library the app uses also takes three minutes off ' +
      'Sunrise, so that offset is taken back out before Sunrise is compared.',
  },
  {
    id: 'kuwaitcity-kuwait',
    place: 'Kuwait City',
    timeZone: 'Asia/Kuwait',
    latitude: 29.3759,
    longitude: 47.9774,
    dayKey: '2026-09-20',
    method: 'Kuwait',
    asrMethod: 'standard',
    query:
      'https://api.aladhan.com/v1/timings/20-09-2026?latitude=29.3759&longitude=47.9774&method=9&school=0&latitudeAdjustmentMethod=1&timezonestring=Asia%2FKuwait',
    timings: {
      fajr: '04:16',
      sunrise: '05:35',
      dhuhr: '11:42',
      asr: '15:10',
      maghrib: '17:47',
      isha: '19:04',
    },
  },
  {
    id: 'doha-qatar',
    place: 'Doha',
    timeZone: 'Asia/Qatar',
    latitude: 25.2854,
    longitude: 51.531,
    dayKey: '2026-09-20',
    method: 'Qatar',
    asrMethod: 'standard',
    query:
      'https://api.aladhan.com/v1/timings/20-09-2026?latitude=25.2854&longitude=51.531&method=10&school=0&latitudeAdjustmentMethod=1&timezonestring=Asia%2FQatar',
    timings: {
      fajr: '04:05',
      sunrise: '05:22',
      dhuhr: '11:27',
      asr: '14:55',
      maghrib: '17:33',
      isha: '19:03',
    },
    note: 'Qatar sets Isha a fixed 90 minutes after Maghrib instead of using a twilight angle.',
  },
  {
    id: 'istanbul-mwl',
    place: 'Istanbul',
    timeZone: 'Europe/Istanbul',
    latitude: 41.0082,
    longitude: 28.9784,
    dayKey: '2026-09-20',
    method: 'MuslimWorldLeague',
    asrMethod: 'standard',
    query:
      'https://api.aladhan.com/v1/timings/20-09-2026?latitude=41.0082&longitude=28.9784&method=3&school=0&latitudeAdjustmentMethod=1&timezonestring=Europe%2FIstanbul',
    timings: {
      fajr: '05:17',
      sunrise: '06:49',
      dhuhr: '12:58',
      asr: '16:26',
      maghrib: '19:05',
      isha: '20:32',
    },
    note: 'A zone that stays on the same offset all year.',
  },
  {
    id: 'oslo-mwl-june',
    place: 'Oslo near midsummer',
    timeZone: 'Europe/Oslo',
    latitude: 59.9139,
    longitude: 10.7522,
    dayKey: '2026-06-21',
    method: 'MuslimWorldLeague',
    asrMethod: 'standard',
    query:
      'https://api.aladhan.com/v1/timings/21-06-2026?latitude=59.9139&longitude=10.7522&method=3&school=0&latitudeAdjustmentMethod=2&timezonestring=Europe%2FOslo',
    timings: {
      fajr: '03:10',
      sunrise: '03:54',
      dhuhr: '13:19',
      asr: '18:00',
      maghrib: '22:44',
      isha: '23:28',
    },
    note:
      'The high latitude case. Just south of the polar circle the sun still sets, but twilight ' +
      'lasts all night, so Fajr and Isha come from a high latitude rule instead of an angle. ' +
      'Both sides were asked for one seventh of the night, which is what the library recommends ' +
      'above 48 degrees, so all six times can be compared here.',
  },
];
