import { screen, within } from '@testing-library/react-native';

import { PrayerTimesList } from '@/components/prayer/PrayerTimesList';
import { translate } from '@/i18n';
import type { NextPrayer, PrayerDay } from '@/types';

import { at } from '../helpers/prayer';
import { renderWithStore } from '../helpers/render';

const DAY_KEY = '2026-09-20';
const NEXT_DAY_KEY = '2026-09-21';

const TODAY: PrayerDay = {
  dayKey: DAY_KEY,
  times: {
    fajr: at(9, 20, 5, 10),
    sunrise: at(9, 20, 6, 20),
    dhuhr: at(9, 20, 12, 15),
    asr: at(9, 20, 15, 40),
    maghrib: at(9, 20, 18, 25),
    isha: at(9, 20, 19, 40),
  },
};

const NEXT_TAG = translate('en', 'prayer.nextTag');
const TOMORROW = translate('en', 'prayer.tomorrow');

/* Between Isha and midnight the next prayer belongs to the following day. */
describe('the list of prayer times', () => {
  it('marks the prayer that is coming today', async () => {
    const next: NextPrayer = { name: 'asr', time: at(9, 20, 15, 40), dayKey: DAY_KEY };
    await renderWithStore(
      <PrayerTimesList day={TODAY} next={next} now={at(9, 20, 13, 0)} clockFormat="12h" />,
    );

    expect(within(screen.getByTestId('prayer-time-asr')).getByText(NEXT_TAG)).toBeOnTheScreen();
    expect(screen.queryByText(TOMORROW)).toBeNull();
  });

  it('still marks Fajr after Isha, and says that it is tomorrow', async () => {
    const next: NextPrayer = { name: 'fajr', time: at(9, 21, 5, 11), dayKey: NEXT_DAY_KEY };
    await renderWithStore(
      <PrayerTimesList day={TODAY} next={next} now={at(9, 20, 21, 0)} clockFormat="12h" />,
    );

    const row = within(screen.getByTestId('prayer-time-fajr'));
    expect(row.getByText(NEXT_TAG)).toBeOnTheScreen();
    expect(row.getByText(TOMORROW)).toBeOnTheScreen();
  });

  it('reads the row out as the next prayer, tomorrow', async () => {
    const next: NextPrayer = { name: 'fajr', time: at(9, 21, 5, 11), dayKey: NEXT_DAY_KEY };
    await renderWithStore(
      <PrayerTimesList day={TODAY} next={next} now={at(9, 20, 21, 0)} clockFormat="12h" />,
    );

    const spoken = [
      translate('en', 'prayer.a11y.row', {
        prayer: translate('en', 'prayer.names.fajr'),
        time: '5:10 AM',
      }),
      TOMORROW,
      translate('en', 'prayer.a11y.nextTag'),
    ].join(', ');
    expect(screen.getByLabelText(spoken)).toBeOnTheScreen();
  });
});
