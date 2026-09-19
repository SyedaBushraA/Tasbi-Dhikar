import { memo } from 'react';

import { AppText } from '@/components/ui';
import { useTranslation } from '@/hooks/useTranslation';
import type { PrayerLocation } from '@/types';

export interface TimeZoneNoteProps {
  location: PrayerLocation;
}

/** The time zone of the phone, when it can be read. */
function deviceTimeZone(): string | undefined {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return zone.length > 0 ? zone : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Times are always calculated for the clock of the phone. Travelling, or a
 * place far away, would otherwise look like a mistake, so it is said plainly.
 */
export const TimeZoneNote = memo(function TimeZoneNote({ location }: TimeZoneNoteProps) {
  const { t } = useTranslation();

  const placeZone = location.timeZone;
  const zone = deviceTimeZone();
  if (placeZone === undefined || zone === undefined || zone === placeZone) return null;

  return (
    <AppText variant="caption" tone="muted" testID="prayer-time-zone-note">
      {t('prayer.timeZoneNote', { zone, place: location.name, placeZone })}
    </AppText>
  );
});
