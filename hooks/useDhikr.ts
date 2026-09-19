import { useMemo } from 'react';

import { useAppSelector } from '@/state';
import type { Dhikr } from '@/types';
import { listDhikr, resolveDhikr } from '@/utils/dhikr';

/** All Dhikr the user can choose from: built-in first, then their own. */
export function useDhikrList(): Dhikr[] {
  const customDhikr = useAppSelector((state) => state.customDhikr);
  return useMemo(() => listDhikr(customDhikr), [customDhikr]);
}

/** The Dhikr that is currently being counted. */
export function useCurrentDhikr(): Dhikr {
  const dhikrId = useAppSelector((state) => state.counter.dhikrId);
  const customDhikr = useAppSelector((state) => state.customDhikr);
  return useMemo(() => resolveDhikr(dhikrId, customDhikr), [dhikrId, customDhikr]);
}
