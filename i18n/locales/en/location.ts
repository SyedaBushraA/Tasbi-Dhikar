export const location = {
  title: 'Location',
  useMyLocation: 'Use my location',
  chooseCity: 'Choose a city',
  privacy: 'It stays on this phone. Your location is never tracked and never sent anywhere.',
  current: {
    title: 'Your place',
    none: 'No place chosen yet.',
    noneHint: 'Choose your place below to see your prayer times.',
    source: {
      automatic: 'Found by your phone',
      city: 'Chosen from the city list',
      coordinates: 'Coordinates you entered',
    },
  },
  locate: {
    hint: 'Your position is read once, only now.',
    busy: 'Finding your location…',
    denied: {
      title: 'Location was not allowed',
      message:
        'Choose your city below instead, or allow location for Tasbi in the settings of your phone.',
    },
    unavailable: {
      title: 'Your location could not be found',
      message: 'Turn on location on your phone and try again, or choose your city below.',
    },
    failed: {
      title: 'Your location could not be read',
      message: 'Please try again, or choose your city below.',
    },
    openPhoneSettings: 'Open phone settings',
  },
  search: {
    label: 'Search for your city',
    placeholder: 'City name',
    hint: 'Other spellings work too, for example Mecca or Makkah.',
    empty: 'No city found. Try another spelling or enter coordinates.',
  },
  coordinates: {
    show: 'Enter coordinates',
    hide: 'Hide coordinates',
    description: 'For a place that is not in the city list.',
    latitude: 'Latitude',
    latitudePlaceholder: 'For example 21.42',
    latitudeHint: 'Between -90 and 90. Use a minus for south.',
    longitude: 'Longitude',
    longitudePlaceholder: 'For example 39.83',
    longitudeHint: 'Between -180 and 180. Use a minus for west.',
    placeName: 'Place name (optional)',
    placeNamePlaceholder: 'What you call this place',
    save: 'Save coordinates',
    errors: {
      latitude: 'Enter a latitude between -90 and 90.',
      longitude: 'Enter a longitude between -180 and 180.',
    },
  },
  a11y: {
    useMyLocationHint: 'Reads the position of your phone once, to find your prayer times',
    cityHint: 'Uses this city for your prayer times',
    showCoordinates: 'Shows the fields for latitude and longitude',
    hideCoordinates: 'Hides the fields for latitude and longitude',
    saveCoordinatesHint: 'Uses these coordinates for your prayer times',
  },
};
