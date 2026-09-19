import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

export interface WelcomeFooterProps {
  primaryLabel: string;
  primaryHint?: string;
  primaryDisabled?: boolean;
  onPrimary: () => void;
  onSkip: () => void;
}

/** The big action at the bottom of every step, with the way out always right below it. */
export function WelcomeFooter({
  primaryLabel,
  primaryHint,
  primaryDisabled = false,
  onPrimary,
  onSkip,
}: WelcomeFooterProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.footer}>
      <AppButton
        label={primaryLabel}
        onPress={onPrimary}
        disabled={primaryDisabled}
        fullWidth
        accessibilityHint={primaryHint}
        style={styles.primary}
      />
      <AppButton
        variant="ghost"
        label={t('welcome.skip')}
        onPress={onSkip}
        fullWidth
        accessibilityHint={t('welcome.skipHint')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { gap: SPACING.sm, paddingTop: SPACING.xl },
  primary: { paddingVertical: SPACING.lg },
});
