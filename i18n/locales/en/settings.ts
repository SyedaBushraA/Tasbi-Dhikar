export const settings = {
  title: 'Settings',
  appearance: {
    title: 'Appearance',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    systemHint: 'System follows the setting of your phone.',
  },
  easyMode: {
    title: 'Easy Mode',
    description: 'Bigger numbers, bigger buttons and a simpler screen.',
  },
  clockFormat: {
    title: 'Time format',
    description: 'How times are shown in History and Prayer Times.',
    twelveHour: '12-hour',
    twentyFourHour: '24-hour',
  },
  counting: {
    title: 'Counting',
  },
  haptics: {
    title: 'Haptic feedback',
    description: 'A gentle vibration with every count.',
  },
  sound: {
    title: 'Sound',
    description: 'A soft tick with every count.',
  },
  reminder: {
    sectionTitle: 'Reminder',
    title: 'Daily reminder',
    description: 'A notification once a day, at the time you choose.',
    timeLabel: 'Reminder time',
    changeTime: 'Change time',
    hour: 'Hour',
    minute: 'Minute',
    period: 'AM or PM',
    am: 'AM',
    pm: 'PM',
    increase: 'Later',
    decrease: 'Earlier',
    saveTime: 'Save time',
    offHint: 'The daily reminder is off. You can turn it on in Settings.',
    deniedTitle: 'Notifications are turned off',
    deniedMessage:
      'To get a daily reminder, allow notifications for Tasbi in the settings of your phone.',
    openPhoneSettings: 'Open phone settings',
    failed: 'The reminder could not be set. Please try again.',
    a11y: {
      increaseHour: 'One hour later',
      decreaseHour: 'One hour earlier',
      increaseMinute: 'Five minutes later',
      decreaseMinute: 'Five minutes earlier',
    },
  },
  prayer: {
    sectionTitle: 'Prayer times',
    title: 'Prayer times, location and Adhan',
    description: 'Your place, the calculation method, prayer notifications and the Adhan.',
    open: 'Opens the prayer settings',
  },
  defaultTarget: {
    title: 'Default target',
    description: 'Used when you choose one of the built-in Dhikr.',
    change: 'Change default target',
  },
  language: {
    title: 'Language',
  },
  data: {
    title: 'Your data',
    clearHistory: 'Clear history',
    clearHistoryDescription: 'Removes all saved sessions and statistics from this phone.',
    clearConfirmTitle: 'Clear all history?',
    clearConfirmMessage:
      'All saved sessions and statistics will be removed. This cannot be undone.',
    clearConfirmAction: 'Clear history',
    cleared: 'History cleared.',
  },
  about: {
    title: 'About',
    version: 'Version',
    privacy: 'Privacy',
    privacySummary: 'Everything stays on your phone. No account, no ads, no tracking.',
    readPrivacy: 'Read privacy information',
    credits: 'With thanks to',
    cityData: 'City data: GeoNames (geonames.org), CC BY 4.0',
    prayerLibrary: 'Prayer time calculation: adhan by Batoul Apps, MIT License',
  },
  privacy: {
    title: 'Privacy',
    intro: 'Tasbi is made to be private and simple.',
    points: {
      local:
        'Your Dhikr, counts, history, settings and prayer settings are stored only on this phone.',
      noAccount: 'There is no account and no sign-in.',
      noNetwork:
        'The app works fully offline: the list of cities and the prayer time calculation are part of the app, and no data leaves the phone.',
      noTracking: 'There are no ads, no analytics and no tracking.',
      location:
        'Your location is used only to calculate prayer times. It is asked for only when you tap the button to use your location, and it is read once, never followed and never sent anywhere. Only the rounded coordinates and the name of the place are kept on this phone, and you can always pick a city by hand instead.',
      permissions:
        'The app asks for notifications only when you turn on the daily reminder or prayer notifications, and for location only when you choose to use your location. Nothing else is asked for.',
      removal:
        'You can remove your history at any time in Settings. Uninstalling the app removes all of its data.',
    },
  },
};
