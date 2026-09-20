import { screen } from '@testing-library/react-native';

import { AboutSection } from '@/components/settings/AboutSection';
import { translate } from '@/i18n';
import { adhanPlaybackAvailable } from '@/services/adhanPlayer';
import { adhanNotificationSounds } from '@/services/prayerNotifications';

import { renderWithStore } from '../helpers/render';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

// What a build carries is decided by the files in it, so the tests say it.
jest.mock('@/services/adhanPlayer', () => ({
  adhanPlaybackAvailable: jest.fn(() => ({ standard: false, fajr: false })),
}));

jest.mock('@/services/prayerNotifications', () => ({
  ...jest.requireActual<typeof import('@/services/prayerNotifications')>(
    '@/services/prayerNotifications',
  ),
  adhanNotificationSounds: jest.fn(() => ({ standard: false, fajr: false })),
}));

const playback = jest.mocked(adhanPlaybackAvailable);
const sounds = jest.mocked(adhanNotificationSounds);

const CREDIT = translate('en', 'settings.about.adhanAudio');

beforeEach(() => {
  playback.mockReturnValue({ standard: false, fajr: false });
  sounds.mockReturnValue({ standard: false, fajr: false });
});

/* Thanks are due for what the app really ships with, and for nothing else. */
describe('the credits', () => {
  it('always names the city data and the calculation library', async () => {
    await renderWithStore(<AboutSection />);

    expect(screen.getByText(translate('en', 'settings.about.cityData'))).toBeOnTheScreen();
    expect(screen.getByText(translate('en', 'settings.about.prayerLibrary'))).toBeOnTheScreen();
  });

  it('names the recording when one is bundled', async () => {
    playback.mockReturnValue({ standard: true, fajr: false });
    await renderWithStore(<AboutSection />);

    expect(screen.getByText(CREDIT)).toBeOnTheScreen();
  });

  it('names a recording as the notification sound too', async () => {
    sounds.mockReturnValue({ standard: true, fajr: false });
    await renderWithStore(<AboutSection />);

    expect(screen.getByText(CREDIT)).toBeOnTheScreen();
  });

  it('says nothing about a recording a build does not carry', async () => {
    await renderWithStore(<AboutSection />);

    expect(screen.queryByText(CREDIT)).toBeNull();
  });
});
