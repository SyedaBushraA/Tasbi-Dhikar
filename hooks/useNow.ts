import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const MINUTE = 60000;

/**
 * The current time, refreshed once a minute. The timer is lined up with the
 * full minute so a displayed time never lags behind the clock of the phone,
 * and the time is read again when the app comes back to the foreground.
 */
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = (): void => {
      timer = setTimeout(() => {
        setNow(Date.now());
        schedule();
      }, MINUTE - (Date.now() % MINUTE));
    };

    const refresh = (): void => {
      if (timer !== undefined) clearTimeout(timer);
      setNow(Date.now());
      schedule();
    };

    schedule();

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') refresh();
    });

    return () => {
      if (timer !== undefined) clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return now;
}
