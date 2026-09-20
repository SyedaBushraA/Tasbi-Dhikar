import { useEffect, useState } from 'react';

import { AppButton } from '@/components/ui';
import { useTranslation } from '@/hooks/useTranslation';
import {
  type AdhanPlayback,
  getAdhanPlayback,
  stopAdhan,
  subscribeAdhanPlayback,
} from '@/services/adhanPlayer';

/**
 * A way out of the Adhan while it is playing. The recording is minutes long,
 * and it starts on its own when a prayer arrives while the app is open, so the
 * button has to be where the user already is.
 */
export function AdhanStopButton() {
  const { t } = useTranslation();
  const [playback, setPlayback] = useState<AdhanPlayback>(getAdhanPlayback);

  useEffect(() => subscribeAdhanPlayback(setPlayback), []);

  if (!playback.playing) return null;

  return (
    <AppButton
      icon="stop"
      label={t('prayer.stopAdhan')}
      onPress={stopAdhan}
      fullWidth
      accessibilityHint={t('prayer.a11y.stopAdhanHint')}
      testID="prayer-stop-adhan"
    />
  );
}
