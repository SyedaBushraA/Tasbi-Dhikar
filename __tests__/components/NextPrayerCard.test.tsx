import { screen } from '@testing-library/react-native';

import { NextPrayerCard } from '@/components/prayer/NextPrayerCard';
import { translate } from '@/i18n';
import type { NextPrayer } from '@/types';

import { at } from '../helpers/prayer';
import { renderWithStore } from '../helpers/render';

const TOMORROW = translate('en', 'prayer.tomorrow');

describe('the next prayer card', () => {
  it('says nothing about another day while the prayer is still today', async () => {
    const next: NextPrayer = { name: 'asr', time: at(9, 20, 15, 40), dayKey: '2026-09-20' };
    await renderWithStore(<NextPrayerCard next={next} now={at(9, 20, 13, 0)} clockFormat="12h" />);

    expect(screen.getByTestId('prayer-next-card')).toBeOnTheScreen();
    expect(screen.queryByTestId('prayer-next-tomorrow')).toBeNull();
  });

  it('says that the prayer is tomorrow once Isha has passed', async () => {
    const next: NextPrayer = { name: 'fajr', time: at(9, 21, 5, 11), dayKey: '2026-09-21' };
    await renderWithStore(<NextPrayerCard next={next} now={at(9, 20, 21, 0)} clockFormat="12h" />);

    expect(screen.getByTestId('prayer-next-tomorrow')).toBeOnTheScreen();
    expect(screen.getByLabelText(new RegExp(`${TOMORROW}$`))).toBeOnTheScreen();
  });

  /* A screen with a title, a place and two buttons and no prayer time at all
     leaves the user with nothing to act on. */
  it('explains itself when no prayer time could be worked out', async () => {
    await renderWithStore(<NextPrayerCard next={null} now={at(9, 20, 13, 0)} clockFormat="12h" />);

    expect(screen.getByText(translate('en', 'prayer.noNextPrayer'))).toBeOnTheScreen();
  });
});
