import { fireEvent, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { CoordinatesForm } from '@/components/location/CoordinatesForm';
import type { PrayerLocation } from '@/types';

import { renderWithStore } from '../helpers/render';

async function openForm(): Promise<jest.Mock<void, [PrayerLocation]>> {
  const onSubmit = jest.fn<void, [PrayerLocation]>();
  await renderWithStore(<CoordinatesForm onSubmit={onSubmit} testID="coords" />);
  fireEvent.press(screen.getByTestId('coords-toggle'));
  return onSubmit;
}

/* Typing the coordinates is the way out after a refused location permission,
   so it has to work everywhere, not only north of the equator. */
describe('coordinates entered by hand', () => {
  it('offers a keyboard that has a minus sign', async () => {
    await openForm();

    for (const field of ['coords-latitude', 'coords-longitude']) {
      // The decimal pad of either phone has no minus key at all.
      expect(screen.getByTestId(field)).not.toHaveProp('keyboardType', 'decimal-pad');
      expect(screen.getByTestId(field)).toHaveProp(
        'keyboardType',
        Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric',
      );
    }
  });

  it('takes a place south of the equator and west of Greenwich', async () => {
    const onSubmit = await openForm();

    fireEvent.changeText(screen.getByTestId('coords-latitude'), '-33.8688');
    fireEvent.changeText(screen.getByTestId('coords-longitude'), '-70.6693');
    fireEvent.press(screen.getByTestId('coords-save'));

    // Stored no more precisely than the calculation needs, as the privacy
    // information promises for every coordinate that is kept.
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'coordinates', latitude: -33.869, longitude: -70.669 }),
    );
  });

  it('keeps a comma as a decimal point and a sign in front', async () => {
    const onSubmit = await openForm();

    fireEvent.changeText(screen.getByTestId('coords-latitude'), '-1,2864');
    fireEvent.changeText(screen.getByTestId('coords-longitude'), '+36,8172');
    fireEvent.press(screen.getByTestId('coords-save'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: -1.286, longitude: 36.817 }),
    );
  });

  it('says which field is wrong instead of saving nonsense', async () => {
    const onSubmit = await openForm();

    fireEvent.changeText(screen.getByTestId('coords-latitude'), '95');
    fireEvent.changeText(screen.getByTestId('coords-longitude'), 'east');
    fireEvent.press(screen.getByTestId('coords-save'));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
