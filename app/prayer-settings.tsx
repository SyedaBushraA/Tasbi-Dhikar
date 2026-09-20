import { CalculationSection } from '@/components/prayerSettings/CalculationSection';
import { LocationSection } from '@/components/prayerSettings/LocationSection';
import { PrayerAlertsSection } from '@/components/prayerSettings/PrayerAlertsSection';
import { TimeFormatSection } from '@/components/prayerSettings/TimeFormatSection';
import { Screen } from '@/components/ui';
import { useAppSelector } from '@/state';

/** Everything behind the prayer times: place, calculation, notifications and the Adhan. */
export default function PrayerSettingsScreen() {
  const prayer = useAppSelector((state) => state.prayer);
  const clockFormat = useAppSelector((state) => state.settings.clockFormat);

  return (
    <Screen scroll edges={['left', 'right', 'bottom']} testID="prayer-settings-screen">
      <LocationSection location={prayer.location} />
      <CalculationSection prayer={prayer} />
      <TimeFormatSection clockFormat={clockFormat} />
      <PrayerAlertsSection prayer={prayer} />
    </Screen>
  );
}
