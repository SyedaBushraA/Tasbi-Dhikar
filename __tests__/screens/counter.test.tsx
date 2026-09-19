import { act, fireEvent, screen } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';

import CounterScreen from '@/app/(tabs)/index';
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

const TAP = 'counter-tap';

function press(testID: string): void {
  fireEvent.press(screen.getByTestId(testID));
}

function buttonWith(buttons: AlertButton[], style: AlertButton['style']): AlertButton | undefined {
  return buttons.find((button) => button.style === style);
}

describe('the counter screen', () => {
  it('counts one Dhikr per tap', async () => {
    const { store } = await renderWithStore(<CounterScreen />);

    press(TAP);
    press(TAP);
    press(TAP);

    expect(screen.getByTestId('counter-count')).toHaveTextContent('3');
    expect(store.getState().counter.count).toBe(3);
  });

  it('shows what is left of the target', async () => {
    await renderWithStore(<CounterScreen />);

    press(TAP);

    expect(screen.getByText(translate('en', 'counter.progressOf', { count: 1, target: 33 })))
      .toBeOnTheScreen();
    expect(screen.getByText(translate('en', 'counter.remaining', { remaining: 32 })))
      .toBeOnTheScreen();
  });

  it('takes a count back and never goes below zero', async () => {
    const { store } = await renderWithStore(<CounterScreen />);

    press(TAP);
    press('counter-undo');

    expect(store.getState().counter.count).toBe(0);
    expect(screen.getByTestId('counter-count')).toHaveTextContent('0');

    expect(screen.getByTestId('counter-undo')).toBeDisabled();
    press('counter-undo');

    expect(store.getState().counter.count).toBe(0);
  });

  it('celebrates the finished round and offers another one', async () => {
    const { store } = await renderWithStore(<CounterScreen />, {
      state: { counter: { target: 2 } },
    });

    press(TAP);
    press(TAP);

    expect(screen.getByText(translate('en', 'counter.completedTitle'))).toBeOnTheScreen();
    expect(screen.getByText(translate('en', 'counter.startAnotherRound'))).toBeOnTheScreen();
    expect(store.getState().history).toHaveLength(1);

    press('counter-start-new-round');

    expect(store.getState().counter.count).toBe(0);
    expect(store.getState().history).toHaveLength(1);
    expect(screen.queryByTestId('counter-completion')).toBeNull();
  });

  it('stops counting the finished round even if the circle is tapped again', async () => {
    const { store } = await renderWithStore(<CounterScreen />, {
      state: { counter: { target: 1 } },
    });

    press(TAP);
    press(TAP);

    expect(store.getState().counter.count).toBe(1);
  });

  it('blocks counting while the round is paused', async () => {
    const { store } = await renderWithStore(<CounterScreen />);

    press(TAP);
    press('counter-pause');

    expect(store.getState().counter.paused).toBe(true);
    expect(screen.getByText(translate('en', 'counter.pausedHint'))).toBeOnTheScreen();

    press(TAP);

    expect(store.getState().counter.count).toBe(1);

    press('counter-pause');
    press(TAP);

    expect(store.getState().counter.count).toBe(2);
  });

  it('asks before it sets the count back to zero', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { store } = await renderWithStore(<CounterScreen />);

    press(TAP);
    press(TAP);
    press('counter-reset');

    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0]?.[0]).toBe(translate('en', 'counter.resetConfirmTitle'));
    expect(alert.mock.calls[0]?.[1]).toBe(
      translate('en', 'counter.resetConfirmMessage', { count: 2 }),
    );

    const destructive = buttonWith(alert.mock.calls[0]?.[2] ?? [], 'destructive');
    expect(destructive?.text).toBe(translate('en', 'counter.resetConfirmAction'));

    await act(async () => {
      destructive?.onPress?.();
    });

    expect(store.getState().counter.count).toBe(0);

    alert.mockRestore();
  });

  it('keeps the count when the reset is cancelled', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { store } = await renderWithStore(<CounterScreen />);

    press(TAP);
    press('counter-reset');

    const cancel = buttonWith(alert.mock.calls[0]?.[2] ?? [], 'cancel');
    expect(cancel?.text).toBe(translate('en', 'common.cancel'));

    await act(async () => {
      cancel?.onPress?.();
    });

    expect(store.getState().counter.count).toBe(1);

    alert.mockRestore();
  });

  it('warns when the count could not be saved on this phone', async () => {
    const { storage, store } = await renderWithStore(<CounterScreen />);

    expect(screen.queryByTestId('counter-save-failed')).toBeNull();

    storage.failWrites(true);
    await act(async () => {
      store.dispatch({ type: 'updateSettings', patch: { soundEnabled: true } });
      await store.flush();
    });

    expect(screen.getByTestId('counter-save-failed')).toBeOnTheScreen();
    expect(screen.getByText(translate('en', 'counter.saveFailed'))).toBeOnTheScreen();
  });
});
