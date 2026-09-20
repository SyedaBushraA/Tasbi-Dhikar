import { fireEvent, screen } from '@testing-library/react-native';

import { AdjustmentStepper } from '@/components/prayerSettings/AdjustmentStepper';
import { MAX_ADJUSTMENT, MIN_ADJUSTMENT } from '@/constants/prayer';
import { translate, translateCount } from '@/i18n';

import { renderWithStore } from '../helpers/render';

const FAJR = translate('en', 'prayer.names.fajr');
const TIME = '5:10 AM';

async function renderStepper(minutes: number): Promise<jest.Mock<void, [number]>> {
  const onChange = jest.fn<void, [number]>();
  await renderWithStore(
    <AdjustmentStepper
      prayer="fajr"
      minutes={minutes}
      timeText={TIME}
      onChange={onChange}
      testID="adjust"
    />,
  );
  return onChange;
}

describe('the minute stepper of a prayer time', () => {
  it('moves the time a minute at a time', async () => {
    const onChange = await renderStepper(2);

    fireEvent.press(screen.getByTestId('adjust-later'));
    expect(onChange).toHaveBeenCalledWith(3);

    fireEvent.press(screen.getByTestId('adjust-earlier'));
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  /* Without a live region the change is silent for a screen reader: the
     buttons stay the same and only the value between them moves. */
  it('announces the value it changed', async () => {
    await renderStepper(0);

    const unchanged = translate('en', 'prayerSettings.adjustments.a11y.unchanged');
    const value = screen.getByLabelText(`${FAJR}, ${TIME}, ${unchanged}`);
    expect(value).toHaveProp('accessibilityLiveRegion', 'polite');
  });

  it('reads the value out in words', async () => {
    await renderStepper(-3);

    const spoken = translateCount('en', 'prayerSettings.adjustments.a11y.minutesEarlier', 3);
    expect(screen.getByLabelText(`${FAJR}, ${TIME}, ${spoken}`)).toBeOnTheScreen();
  });

  it('stops at the ends of the range', async () => {
    await renderStepper(MAX_ADJUSTMENT);
    expect(screen.getByTestId('adjust-later')).toBeDisabled();

    screen.unmount();
    await renderStepper(MIN_ADJUSTMENT);
    expect(screen.getByTestId('adjust-earlier')).toBeDisabled();
  });
});
