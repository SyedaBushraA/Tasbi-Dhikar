import { screen } from '@testing-library/react-native';

import HistoryScreen from '@/app/(tabs)/history';
import { translate } from '@/i18n';
import { toDayKey } from '@/utils/date';

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

/** Late morning today, so the session belongs to the current day in any time zone. */
const TODAY = new Date();
TODAY.setHours(10, 30, 0, 0);
const TODAY_AT = TODAY.getTime();

const SESSION = {
  id: 's1',
  dhikrId: 'subhanallah',
  dhikrName: 'SubhanAllah',
  count: 33,
  target: 33,
  completedAt: TODAY_AT,
};

describe('the history screen', () => {
  it('explains that there is nothing yet and offers a way to start', async () => {
    await renderWithStore(<HistoryScreen />);

    expect(screen.getByText(translate('en', 'history.emptyTitle'))).toBeOnTheScreen();
    expect(screen.getByText(translate('en', 'history.emptyMessage'))).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: translate('en', 'history.goToCounter') }),
    ).toBeOnTheScreen();
  });

  it('shows zeros in the summary while nothing has been counted', async () => {
    await renderWithStore(<HistoryScreen />);

    expect(screen.getByText(translate('en', 'history.todayTotal'))).toBeOnTheScreen();
    expect(screen.getByText(translate('en', 'history.completedSessions'))).toBeOnTheScreen();
  });

  it('puts a session finished today under "Today"', async () => {
    await renderWithStore(<HistoryScreen />, {
      state: {
        history: [SESSION],
        stats: { daily: { [toDayKey(TODAY_AT)]: 33 }, completedSessions: 1 },
      },
    });

    expect(screen.getByText(translate('en', 'common.today'))).toBeOnTheScreen();
    expect(screen.getByText('SubhanAllah')).toBeOnTheScreen();
    expect(
      screen.getByText(translate('en', 'history.sessionTarget', { target: 33 })),
    ).toBeOnTheScreen();
    expect(screen.queryByText(translate('en', 'history.emptyTitle'))).toBeNull();
  });

  it('adds up the day in its heading', async () => {
    const earlier = {
      ...SESSION,
      id: 's2',
      count: 99,
      target: 99,
      completedAt: TODAY_AT - 3_600_000,
    };
    await renderWithStore(<HistoryScreen />, {
      state: {
        history: [SESSION, earlier],
        stats: { daily: { [toDayKey(TODAY_AT)]: 132 }, completedSessions: 2 },
      },
    });

    expect(
      screen.getByText(translate('en', 'history.dayTotal', { total: 132 })),
    ).toBeOnTheScreen();
  });

  it('reads a session out as one sentence', async () => {
    await renderWithStore(<HistoryScreen />, { state: { history: [SESSION] } });

    const rows = screen.getAllByLabelText(/SubhanAllah, 33 of 33/);
    expect(rows).toHaveLength(1);
  });

  it('gives the page a heading', async () => {
    await renderWithStore(<HistoryScreen />);

    expect(
      screen.getByRole('header', { name: translate('en', 'history.title') }),
    ).toBeOnTheScreen();
  });
});
