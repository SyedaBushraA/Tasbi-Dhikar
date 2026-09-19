import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import type { Dhikr } from '@/types';

import { DhikrRow } from './DhikrRow';

export interface CustomDhikrRowProps {
  dhikr: Dhikr;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: (dhikr: Dhikr) => void;
  onDelete: (dhikr: Dhikr) => void;
  testID?: string;
}

/** A Dhikr the user made: choosable like the others, with its own Edit and Delete buttons. */
export const CustomDhikrRow = memo(function CustomDhikrRow({
  dhikr,
  selected,
  onSelect,
  onEdit,
  onDelete,
  testID,
}: CustomDhikrRowProps) {
  const { t } = useTranslation();

  return (
    <View testID={testID}>
      <DhikrRow
        dhikr={dhikr}
        selected={selected}
        onSelect={onSelect}
        testID={testID ? `${testID}-select` : undefined}
      />
      <View style={styles.actions}>
        <AppButton
          label={t('common.edit')}
          icon="create-outline"
          variant="secondary"
          onPress={() => onEdit(dhikr)}
          accessibilityLabel={t('dhikr.a11y.editLabel', { name: dhikr.name })}
          accessibilityHint={t('dhikr.a11y.editHint')}
          style={styles.action}
          testID={testID ? `${testID}-edit` : undefined}
        />
        <AppButton
          label={t('common.delete')}
          icon="trash-outline"
          variant="secondary"
          onPress={() => onDelete(dhikr)}
          accessibilityLabel={t('dhikr.a11y.deleteLabel', { name: dhikr.name })}
          accessibilityHint={t('dhikr.a11y.deleteHint')}
          style={styles.action}
          testID={testID ? `${testID}-delete` : undefined}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  action: { flexGrow: 1, flexBasis: 120 },
});
