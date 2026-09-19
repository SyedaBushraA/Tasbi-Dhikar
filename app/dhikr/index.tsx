import { router } from 'expo-router';
import { Fragment, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { CustomDhikrRow } from '@/components/dhikr/CustomDhikrRow';
import { DhikrRow } from '@/components/dhikr/DhikrRow';
import { leaveScreen } from '@/components/dhikr/navigation';
import { hasUnfinishedRound, useDhikrConfirmations } from '@/components/dhikr/useDhikrConfirmations';
import { AppButton, AppText, Notice, RowDivider, Screen, Section } from '@/components/ui';
import { MAX_CUSTOM_DHIKR } from '@/constants/dhikr';
import { SPACING } from '@/constants/theme';
import { useDhikrList } from '@/hooks/useDhikr';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppActions, useAppSelector } from '@/state';
import type { Dhikr } from '@/types';

export default function ChooseDhikrScreen() {
  const { t, n } = useTranslation();
  const actions = useAppActions();
  const counter = useAppSelector((state) => state.counter);
  const dhikrList = useDhikrList();
  const { confirmNewRound, confirmDelete } = useDhikrConfirmations();

  const builtIn = useMemo(() => dhikrList.filter((dhikr) => !dhikr.isCustom), [dhikrList]);
  const custom = useMemo(() => dhikrList.filter((dhikr) => dhikr.isCustom), [dhikrList]);
  const atLimit = custom.length >= MAX_CUSTOM_DHIKR;

  const handleSelect = useCallback(
    (id: string) => {
      if (id === counter.dhikrId) {
        leaveScreen();
        return;
      }
      const use = () => {
        actions.selectDhikr(id);
        leaveScreen();
      };
      // Switching starts a fresh round, so a started one is not thrown away silently.
      if (hasUnfinishedRound(counter)) confirmNewRound(use);
      else use();
    },
    [actions, counter, confirmNewRound],
  );

  const handleEdit = useCallback((dhikr: Dhikr) => {
    router.push({ pathname: '/dhikr/custom', params: { id: dhikr.id } });
  }, []);

  const handleDelete = useCallback(
    (dhikr: Dhikr) => {
      confirmDelete(dhikr, () => actions.deleteCustomDhikr(dhikr.id));
    },
    [actions, confirmDelete],
  );

  return (
    <Screen scroll edges={['left', 'right', 'bottom']} testID="dhikr-list-screen">
      <Section title={t('dhikr.builtInSection')}>
        <View accessibilityRole="radiogroup" accessibilityLabel={t('dhikr.builtInSection')}>
          {builtIn.map((dhikr, index) => (
            <Fragment key={dhikr.id}>
              {index > 0 ? <RowDivider /> : null}
              <DhikrRow
                dhikr={dhikr}
                selected={dhikr.id === counter.dhikrId}
                onSelect={handleSelect}
                testID={`dhikr-row-${dhikr.id}`}
              />
            </Fragment>
          ))}
        </View>
      </Section>

      <Section title={t('dhikr.customSection')} grouped={custom.length > 0}>
        {custom.length === 0 ? (
          <AppText tone="muted" style={styles.empty}>
            {t('dhikr.customEmpty')}
          </AppText>
        ) : (
          <View accessibilityRole="radiogroup" accessibilityLabel={t('dhikr.customSection')}>
            {custom.map((dhikr, index) => (
              <Fragment key={dhikr.id}>
                {index > 0 ? <RowDivider /> : null}
                <CustomDhikrRow
                  dhikr={dhikr}
                  selected={dhikr.id === counter.dhikrId}
                  onSelect={handleSelect}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  testID={`dhikr-row-${dhikr.id}`}
                />
              </Fragment>
            ))}
          </View>
        )}
      </Section>

      {atLimit ? (
        <Notice message={t('dhikr.limitReached', { max: n(MAX_CUSTOM_DHIKR) })} testID="dhikr-limit" />
      ) : (
        <AppButton
          label={t('dhikr.addCustom')}
          icon="add"
          variant="secondary"
          fullWidth
          onPress={() => router.push('/dhikr/custom')}
          accessibilityHint={t('dhikr.a11y.addCustomHint')}
          testID="dhikr-add-custom"
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { marginStart: SPACING.xs },
});
