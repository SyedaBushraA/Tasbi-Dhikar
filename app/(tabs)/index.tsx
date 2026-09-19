import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo, Alert, StyleSheet, View, useWindowDimensions } from 'react-native';

import { beadsFilled } from '@/components/counter/BeadRing';
import { CompletionPanel } from '@/components/counter/CompletionPanel';
import { CountButton, counterStatus } from '@/components/counter/CountButton';
import { CounterControls } from '@/components/counter/CounterControls';
import { DhikrHeader } from '@/components/counter/DhikrHeader';
import { ProgressBar } from '@/components/counter/ProgressBar';
import { ProgressSummary } from '@/components/counter/ProgressSummary';
import { TargetPill } from '@/components/counter/TargetPill';
import { AppText, Notice, Screen } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useCurrentDhikr } from '@/hooks/useDhikr';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppActions, useAppSelector, useStoreStatus } from '@/state';
import { canUndo, progress, remaining } from '@/utils/counter';

/** How much of the screen the counter circle may take. */
const CIRCLE = {
  normal: { sideMargin: 64, max: 340, heightShare: 0.36 },
  easy: { sideMargin: 32, max: 460, heightShare: 0.55 },
} as const;
const MIN_CIRCLE = 180;

function circleDiameter(width: number, height: number, easyMode: boolean): number {
  const rule = easyMode ? CIRCLE.easy : CIRCLE.normal;
  const fit = Math.min(width - rule.sideMargin, rule.max, height * rule.heightShare);
  return Math.floor(Math.max(MIN_CIRCLE, fit));
}

export default function CounterScreen() {
  const counter = useAppSelector((state) => state.counter);
  const dhikr = useCurrentDhikr();
  const actions = useAppActions();
  const { saveFailed } = useStoreStatus();
  const { easyMode } = useTheme();
  const { t, n } = useTranslation();
  const { width, height } = useWindowDimensions();

  const status = counterStatus(counter);
  const completed = status === 'completed';
  const undoable = canUndo(counter);
  const circleSize = useMemo(
    () => circleDiameter(width, height, easyMode),
    [width, height, easyMode],
  );

  // The reset dialog needs the count at the moment it opens, without a new handler per tap.
  const countRef = useRef(counter.count);
  useEffect(() => {
    countRef.current = counter.count;
  }, [counter.count]);

  const wasCompleted = useRef(completed);
  useEffect(() => {
    if (completed && !wasCompleted.current) {
      AccessibilityInfo.announceForAccessibility(
        `${t('counter.completedTitle')}. ${t('counter.completedMessage', {
          target: n(counter.target),
          dhikr: dhikr.name,
        })}`,
      );
    }
    wasCompleted.current = completed;
  }, [completed, counter.target, dhikr.name, n, t]);

  const tap = useCallback(() => {
    actions.tap();
  }, [actions]);
  const undo = useCallback(() => actions.undo(), [actions]);
  const togglePause = useCallback(() => actions.togglePause(), [actions]);
  const startNewRound = useCallback(() => actions.startNewRound(), [actions]);
  const openDhikrList = useCallback(() => router.push('/dhikr'), []);
  const openTargetPicker = useCallback(() => router.push('/target'), []);

  const confirmReset = useCallback(() => {
    Alert.alert(
      t('counter.resetConfirmTitle'),
      t('counter.resetConfirmMessage', { count: n(countRef.current) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('counter.resetConfirmAction'), style: 'destructive', onPress: () => actions.reset() },
      ],
      { cancelable: true },
    );
  }, [actions, n, t]);

  // Once the target is reached the completion panel tells the story instead.
  const showProgress = !completed;
  const progressSummary = showProgress ? (
    <ProgressSummary count={counter.count} target={counter.target} remaining={remaining(counter)} />
  ) : null;

  return (
    <Screen scroll contentStyle={styles.content} testID="counter-screen">
      <View style={styles.group}>
        {saveFailed ? (
          <Notice tone="warning" message={t('counter.saveFailed')} testID="counter-save-failed" />
        ) : null}
        <DhikrHeader dhikr={dhikr} onPress={openDhikrList} />
        {easyMode ? null : <TargetPill target={counter.target} onPress={openTargetPicker} />}
      </View>

      <View style={styles.group}>
        {easyMode ? null : progressSummary}
        <CountButton
          size={circleSize}
          count={counter.count}
          target={counter.target}
          status={status}
          beadsFilled={easyMode ? undefined : beadsFilled(counter)}
          onPress={tap}
        />
        {easyMode ? progressSummary : null}
        {easyMode && showProgress ? <ProgressBar progress={progress(counter)} /> : null}
        {status === 'paused' ? (
          <AppText variant="body" tone="muted" align="center" style={styles.hint}>
            {t('counter.pausedHint')}
          </AppText>
        ) : null}
        {completed ? (
          <CompletionPanel
            dhikrName={dhikr.name}
            target={counter.target}
            onStartNewRound={startNewRound}
          />
        ) : null}
      </View>

      <CounterControls
        canUndo={undoable}
        paused={counter.paused}
        completed={completed}
        onUndo={undo}
        onTogglePause={togglePause}
        onReset={confirmReset}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'space-between',
    gap: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  group: { gap: SPACING.md },
  hint: { paddingHorizontal: SPACING.md },
});
