import { useFocusEffect } from 'expo-router';
import { memo, useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { AppButton, AppText, Section } from '@/components/ui';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppActions } from '@/state';

import { AnnouncedNotice } from './AnnouncedNotice';
import { SectionBlock } from './SectionBlock';

/** Clearing the saved history, behind a confirmation. */
export const DataSection = memo(function DataSection() {
  const { t } = useTranslation();
  const actions = useAppActions();
  const [cleared, setCleared] = useState(false);

  useFocusEffect(
    useCallback(() => {
      return () => setCleared(false);
    }, []),
  );

  function confirmClear() {
    Alert.alert(
      t('settings.data.clearConfirmTitle'),
      t('settings.data.clearConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.data.clearConfirmAction'),
          style: 'destructive',
          onPress: () => {
            actions.clearHistory();
            setCleared(true);
          },
        },
      ],
      { cancelable: true },
    );
  }

  return (
    <Section title={t('settings.data.title')}>
      <SectionBlock>
        <AppText variant="body" tone="muted">
          {t('settings.data.clearHistoryDescription')}
        </AppText>
        <AppButton
          variant="danger"
          icon="trash-outline"
          label={t('settings.data.clearHistory')}
          onPress={confirmClear}
          fullWidth
          testID="settings-clear-history"
        />
        {cleared ? (
          <AnnouncedNotice message={t('settings.data.cleared')} testID="settings-history-cleared" />
        ) : null}
      </SectionBlock>
    </Section>
  );
});
