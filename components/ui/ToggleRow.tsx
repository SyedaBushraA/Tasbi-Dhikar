import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

import { AppText } from './AppText';

export interface ToggleRowProps {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  testID?: string;
}

/**
 * An on/off setting. The whole row is the touch target and is announced as one
 * switch; the state is also written out as "On" or "Off" so it never depends
 * on colour alone.
 */
export function ToggleRow({
  title,
  description,
  value,
  onValueChange,
  disabled = false,
  testID,
}: ToggleRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors } = theme;

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={title}
      accessibilityHint={description}
      accessibilityState={{ checked: value, disabled }}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        { minHeight: theme.touchTarget + SPACING.sm, opacity: disabled ? 0.5 : 1 },
        pressed && { backgroundColor: colors.pressedOverlay },
      ]}
    >
      <View style={styles.texts}>
        <AppText variant="body">{title}</AppText>
        {description ? (
          <AppText variant="caption" tone="muted">
            {description}
          </AppText>
        ) : null}
      </View>
      <AppText variant="label" tone={value ? 'primary' : 'muted'}>
        {value ? t('common.on') : t('common.off')}
      </AppText>
      {/* The row handles the touch; the switch only shows the state. */}
      <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants">
        <Switch
          value={value}
          disabled={disabled}
          trackColor={{ false: colors.track, true: colors.primary }}
          thumbColor={colors.surface}
          ios_backgroundColor={colors.track}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  texts: { flex: 1, gap: 2 },
});
