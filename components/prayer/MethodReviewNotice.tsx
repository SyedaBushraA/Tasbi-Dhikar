import { router } from 'expo-router';
import { memo, useCallback } from 'react';
import { StyleSheet } from 'react-native';

import { AppButton, AppText, Notice } from '@/components/ui';
import { useTranslation } from '@/hooks/useTranslation';
import type { CalculationMethodId } from '@/types';

import { methodKey } from './labels';

export interface MethodReviewNoticeProps {
  /** The method that is preselected but not confirmed yet. */
  method: CalculationMethodId;
}

/**
 * The method was only suggested from the country, so it is never presented as
 * settled: the user is asked to look at it while the times are already shown.
 */
export const MethodReviewNotice = memo(function MethodReviewNotice({
  method,
}: MethodReviewNoticeProps) {
  const { t } = useTranslation();
  const openMethod = useCallback(() => router.push('/prayer-method'), []);

  return (
    <Notice message={t('prayer.methodReview.title')} testID="prayer-method-review">
      <AppText variant="body">
        {t('prayer.methodReview.message', { method: t(methodKey(method)) })}
      </AppText>
      <AppButton
        label={t('prayer.methodReview.action')}
        icon="options-outline"
        variant="secondary"
        onPress={openMethod}
        accessibilityHint={t('prayer.methodReview.actionHint')}
        style={styles.action}
        testID="prayer-review-method"
      />
    </Notice>
  );
});

const styles = StyleSheet.create({
  action: { alignSelf: 'flex-start' },
});
