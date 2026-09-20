export const prayerSettings = {
  title: 'Prayer settings',
  methodTitle: 'Calculation method',
  asrTitle: 'Asr time',
  adjustmentsTitle: 'Manual adjustments',
  notificationsTitle: 'Prayer notifications',
  adhanTitle: 'Adhan',
  location: {
    title: 'Location',
    none: 'Prayer times are calculated for a place. No place is chosen yet.',
    set: 'Set location',
    change: 'Change the place prayer times are calculated for',
  },
  calculation: {
    title: 'Calculation',
    intro:
      'Prayer times differ between calculation methods. Choose the one your local mosque or authority follows.',
    suggested: 'Suggested for {country}',
    asrSuggested: 'Suggested for {country}: {asr}',
    asrExplanation: 'With the Hanafi method, Asr comes later in the afternoon.',
    angles: 'Fajr {fajr}°, Isha {isha}°',
    interval: 'Fajr {fajr}°, Isha {minutes} minutes after Maghrib',
    unconfirmed: 'Not confirmed yet. Please check it.',
    methodHint: 'Choose how prayer times are calculated',
    asrHint: 'Choose the Asr time',
    adjustmentsHint: 'Move single prayer times by a few minutes',
    preview: 'Today with this choice',
    previewHint: 'Set your location to see today’s times here.',
    use: 'Use this method',
  },
  timeFormat: {
    title: 'Time format',
    twelveHour: '12-hour',
    twentyFourHour: '24-hour',
  },
  adjustments: {
    intro:
      'Your local mosque may pray a few minutes earlier or later than the calculation. Move each time here.',
    none: 'None',
    value: '{minutes} min',
    resultingTime: 'Today: {time}',
    noLocation: 'Set your location to see the resulting times.',
    earlier: '1 min earlier',
    later: '1 min later',
    resetAll: 'Reset all adjustments',
    resetTitle: 'Reset all adjustments?',
    resetMessage: 'Every prayer time goes back to the calculated time.',
    resetAction: 'Reset',
    a11y: {
      earlier: 'One minute earlier for {prayer}',
      later: 'One minute later for {prayer}',
      unchanged: 'No change',
      minutesEarlier: {
        one: '{count} minute earlier',
        other: '{count} minutes earlier',
      },
      minutesLater: {
        one: '{count} minute later',
        other: '{count} minutes later',
      },
    },
  },
  alerts: {
    title: 'Prayer alerts',
    intro: 'Choose what happens at each prayer time.',
    allPrayers: 'All prayers',
    mixed: 'Set one by one below',
    setEach: 'Set each prayer',
    needLocation: 'Set your location first.',
    modes: {
      off: 'Off',
      notification: 'Notification',
      adhan: 'Adhan',
    },
    a11y: {
      allGroup: 'Alert for all prayers',
      group: 'Alert for {prayer}',
    },
  },
  notifications: {
    intro: 'A notification at the time of each prayer you turn on.',
    all: 'All prayers',
    someOn: '{count} of {total} turned on',
    needLocation: 'Set your location first.',
    planNote:
      'Notifications are planned {days} days ahead and refreshed every time you open Tasbi.',
    denied: 'Notifications are turned off for Tasbi.',
    deniedMessage:
      'To get prayer notifications, allow notifications for Tasbi in the settings of your phone.',
    failed: 'Prayer notifications could not be set up on this device.',
    openPhoneSettings: 'Open phone settings',
    exactTip:
      'For alerts exactly on time, allow “Alarms & reminders” for Tasbi and turn off battery optimisation.',
  },
  adhan: {
    master: 'Adhan',
    masterDescription: 'Play the Adhan with your prayer notifications.',
    forPrayer: '{prayer} Adhan',
    needNotification: 'Turn on the {prayer} notification to hear the Adhan.',
    separateFajr: 'Separate Fajr Adhan',
    separateFajrDescription: 'Use the Fajr recording for Fajr.',
    notIncluded:
      'No Adhan recording is included in this version. Prayer notifications use the normal notification sound.',
    volume: 'Adhan volume',
    volumeValue: '{percent}%',
    volumeCaption:
      'Used when the Adhan plays in the app. When Tasbi is closed, your phone’s notification volume applies.',
    test: 'Play test',
    testFajr: 'Play Fajr Adhan',
    stop: 'Stop',
    platformNote:
      'When Tasbi is closed, the Adhan plays as the notification sound, and your phone decides how long it plays. On iPhone that is up to 30 seconds.',
  },
};
