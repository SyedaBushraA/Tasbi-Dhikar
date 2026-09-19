import { StyleSheet, View } from 'react-native';

import { PrivacyPoint } from '@/components/settings/PrivacyPoint';
import { AppText, type IconName, Screen } from '@/components/ui';
import { SPACING } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

const POINTS = [
  { key: 'local', icon: 'phone-portrait-outline' },
  { key: 'noAccount', icon: 'person-outline' },
  { key: 'noNetwork', icon: 'cloud-offline-outline' },
  { key: 'noTracking', icon: 'eye-off-outline' },
  { key: 'location', icon: 'location-outline' },
  { key: 'permissions', icon: 'notifications-outline' },
  { key: 'removal', icon: 'trash-outline' },
] as const satisfies readonly { key: string; icon: IconName }[];

export default function PrivacyScreen() {
  const { t } = useTranslation();

  return (
    <Screen scroll edges={['left', 'right', 'bottom']} testID="privacy-screen">
      <AppText variant="heading" style={styles.intro}>
        {t('settings.privacy.intro')}
      </AppText>
      <View style={styles.points}>
        {POINTS.map((point) => (
          <PrivacyPoint
            key={point.key}
            icon={point.icon}
            text={t(`settings.privacy.points.${point.key}`)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: SPACING.xl },
  points: { gap: SPACING.xl },
});
