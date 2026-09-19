import { act, fireEvent, screen } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';

import SettingsScreen from '@/app/(tabs)/settings';
import { translate } from '@/i18n';

import { renderWithStore } from '../helpers/render';

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<typeof import('react')>('react');
  return {
    router: {
      push: jest.fn(),
      replace: jest.fn(),
      navigate: jest.fn(),
      back: jest.fn(),
      canGoBack: jest.fn(() => false),
      dismissAll: jest.fn(),
      setParams: jest.fn(),
    },
    Stack: { Screen: () => null },
    useLocalSearchParams: () => ({}),
    useFocusEffect: (effect: () => undefined | (() => void)) => useEffect(effect, [effect]),
  };
});

function press(testID: string): void {
  fireEvent.press(screen.getByTestId(testID));
}

function buttonWith(buttons: AlertButton[], style: AlertButton['style']): AlertButton | undefined {
  return buttons.find((button) => button.style === style);
}

describe('the settings screen', () => {
  it('gives the page a heading', async () => {
    await renderWithStore(<SettingsScreen />);

    expect(
      screen.getByRole('header', { name: translate('en', 'settings.title') }),
    ).toBeOnTheScreen();
  });

  it('turns Easy Mode on and off again', async () => {
    const { store } = await renderWithStore(<SettingsScreen />);

    press('settings-easy-mode');
    expect(store.getState().settings.easyMode).toBe(true);
    expect(screen.getByTestId('settings-easy-mode')).toBeChecked();

    press('settings-easy-mode');
    expect(store.getState().settings.easyMode).toBe(false);
  });

  it('changes the theme', async () => {
    const { store } = await renderWithStore(<SettingsScreen />);

    expect(screen.getByTestId('settings-theme-system')).toBeChecked();

    press('settings-theme-dark');

    expect(store.getState().settings.theme).toBe('dark');
    expect(screen.getByTestId('settings-theme-dark')).toBeChecked();
  });

  it('changes the time format and brings the prayer notifications up to date', async () => {
    const { services, store } = await renderWithStore(<SettingsScreen />);

    expect(screen.getByTestId('settings-clock-format-12h')).toBeChecked();

    press('settings-clock-format-24h');

    expect(store.getState().settings.clockFormat).toBe('24h');
    expect(services.prayer.syncAlerts).toHaveBeenCalledTimes(1);
  });

  it('shows the counting settings that are saved', async () => {
    await renderWithStore(<SettingsScreen />, {
      state: { settings: { defaultTarget: 99, hapticsEnabled: false } },
    });

    expect(screen.getByTestId('settings-default-target')).toBeOnTheScreen();
    expect(screen.getByText('99')).toBeOnTheScreen();
    expect(screen.getByTestId('settings-haptics')).not.toBeChecked();
  });

  it('turns the daily reminder on and schedules it', async () => {
    const { services, store } = await renderWithStore(<SettingsScreen />);

    await act(async () => {
      press('settings-reminder');
    });

    expect(services.reminders.schedule).toHaveBeenCalledTimes(1);
    expect(store.getState().settings.reminder.enabled).toBe(true);
  });

  it('explains a refused notification permission without a pop-up', async () => {
    const { services, store } = await renderWithStore(<SettingsScreen />);
    services.reminders.schedule.mockResolvedValue('denied');

    await act(async () => {
      press('settings-reminder');
    });

    expect(store.getState().settings.reminder.enabled).toBe(false);
    expect(screen.getByTestId('settings-reminder-notice')).toBeOnTheScreen();
    expect(screen.getByText(translate('en', 'settings.reminder.deniedMessage'))).toBeOnTheScreen();
  });

  it('opens the prayer settings from one row', async () => {
    await renderWithStore(<SettingsScreen />);

    expect(screen.getByTestId('settings-prayer')).toBeOnTheScreen();
    expect(screen.getByText(translate('en', 'settings.prayer.title'))).toBeOnTheScreen();
  });

  it('asks before it clears the history', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { store } = await renderWithStore(<SettingsScreen />, {
      state: {
        history: [
          {
            id: 's1',
            dhikrId: 'subhanallah',
            dhikrName: 'SubhanAllah',
            count: 33,
            target: 33,
            completedAt: Date.now(),
          },
        ],
        stats: { daily: { '2026-09-14': 33 }, completedSessions: 1 },
      },
    });

    press('settings-clear-history');

    expect(alert.mock.calls[0]?.[0]).toBe(translate('en', 'settings.data.clearConfirmTitle'));
    expect(alert.mock.calls[0]?.[1]).toBe(translate('en', 'settings.data.clearConfirmMessage'));

    const cancel = buttonWith(alert.mock.calls[0]?.[2] ?? [], 'cancel');
    await act(async () => {
      cancel?.onPress?.();
    });

    expect(store.getState().history).toHaveLength(1);

    const destructive = buttonWith(alert.mock.calls[0]?.[2] ?? [], 'destructive');
    expect(destructive?.text).toBe(translate('en', 'settings.data.clearConfirmAction'));

    await act(async () => {
      destructive?.onPress?.();
    });

    expect(store.getState().history).toEqual([]);
    expect(store.getState().stats).toEqual({ daily: {}, completedSessions: 0 });
    expect(screen.getByTestId('settings-history-cleared')).toBeOnTheScreen();

    alert.mockRestore();
  });

  it('promises that nothing leaves the phone', async () => {
    await renderWithStore(<SettingsScreen />);

    expect(screen.getByText(translate('en', 'settings.about.privacySummary'))).toBeOnTheScreen();
    expect(screen.getByTestId('settings-credits')).toBeOnTheScreen();
  });
});
