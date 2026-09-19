import { useEffect } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

import { Notice, type NoticeProps } from '@/components/ui';

/** A Notice that is also read out on iOS, which has no live regions. */
export function AnnouncedNotice(props: NoticeProps) {
  const { message } = props;

  useEffect(() => {
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(message);
  }, [message]);

  return <Notice {...props} />;
}
