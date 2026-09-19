import { useMemo } from 'react';
import { Alert } from 'react-native';

import { useTranslation } from '@/hooks/useTranslation';
import { useAppSelector } from '@/state';
import type { CounterState } from '@/types';
import { isComplete } from '@/utils/counter';

/** A round that has counts the user would lose if it were replaced. */
export function hasUnfinishedRound(counter: CounterState): boolean {
  return counter.count > 0 && !isComplete(counter);
}

export interface DhikrConfirmations {
  /** Asks before an action that sets the running count back to zero. */
  confirmNewRound(onConfirm: () => void): void;
  /** Asks before removing one of the user's own Dhikr. */
  confirmDelete(dhikr: { id: string; name: string }, onConfirm: () => void): void;
}

/** The questions the Dhikr screens ask before losing a count or a Dhikr. */
export function useDhikrConfirmations(): DhikrConfirmations {
  const { t, n } = useTranslation();
  const counter = useAppSelector((state) => state.counter);

  return useMemo<DhikrConfirmations>(() => {
    const countLost = t('dhikr.switchConfirmMessage', { count: n(counter.count) });

    return {
      confirmNewRound(onConfirm) {
        Alert.alert(
          t('dhikr.switchConfirmTitle'),
          countLost,
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('dhikr.switchConfirmAction'), style: 'destructive', onPress: onConfirm },
          ],
          { cancelable: true },
        );
      },

      confirmDelete(dhikr, onConfirm) {
        // Deleting the Dhikr being counted also ends its round.
        const losesCount = dhikr.id === counter.dhikrId && counter.count > 0;
        const message = t('dhikr.deleteConfirmMessage', { name: dhikr.name });
        Alert.alert(
          t('dhikr.deleteConfirmTitle'),
          losesCount ? `${message}\n\n${countLost}` : message,
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.delete'), style: 'destructive', onPress: onConfirm },
          ],
          { cancelable: true },
        );
      },
    };
  }, [t, n, counter.count, counter.dhikrId]);
}
