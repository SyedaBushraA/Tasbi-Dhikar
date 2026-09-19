import { type ReactNode, createContext, useContext, useMemo, useSyncExternalStore } from 'react';

import type { AppState } from '@/types';

import type { AppActions } from './actions';
import type { AppStore, StoreStatus } from './store';

interface StoreContextValue {
  store: AppStore;
  actions: AppActions;
}

const StoreContext = createContext<StoreContextValue | null>(null);

interface StoreProviderProps {
  store: AppStore;
  actions: AppActions;
  children: ReactNode;
}

export function StoreProvider({ store, actions, children }: StoreProviderProps) {
  const value = useMemo(() => ({ store, actions }), [store, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function useStoreContext(): StoreContextValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('StoreProvider is missing above this component');
  return value;
}

/**
 * Subscribes to one part of the state. The selector must return a value that
 * keeps its identity while the state behind it is unchanged (a slice or a
 * primitive), so the component only re-renders when that part changes.
 */
export function useAppSelector<T>(selector: (state: AppState) => T): T {
  const { store } = useStoreContext();
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
}

export function useAppActions(): AppActions {
  return useStoreContext().actions;
}

export function useStoreStatus(): StoreStatus {
  const { store } = useStoreContext();
  return useSyncExternalStore(store.subscribe, store.getStatus);
}
