import { fireEvent, screen } from '@testing-library/react-native';

import { VolumeSlider } from '@/components/prayerSettings/VolumeSlider';

import { renderWithStore } from '../helpers/render';

// A plain view in place of the native slider, so the test can raise the three
// events the real one raises.
jest.mock('@react-native-community/slider', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { __esModule: true, default: View };
});

interface Handlers {
  onChange: jest.Mock<void, [number]>;
  onCommit: jest.Mock<void, [number]>;
}

async function renderSlider(): Promise<Handlers> {
  const handlers: Handlers = {
    onChange: jest.fn<void, [number]>(),
    onCommit: jest.fn<void, [number]>(),
  };
  await renderWithStore(
    <VolumeSlider
      value={0.8}
      onChange={handlers.onChange}
      onCommit={handlers.onCommit}
      testID="volume"
    />,
  );
  return handlers;
}

/* TalkBack and VoiceOver change an adjustable without ever starting or ending
   a drag, so a value that is only stored at the end of one is lost. */
describe('the Adhan volume slider', () => {
  it('stores a change that is not a drag straight away', async () => {
    const { onChange, onCommit } = await renderSlider();

    fireEvent(screen.getByTestId('volume-control'), 'valueChange', 0.35);

    expect(onChange).toHaveBeenCalledWith(0.35);
    expect(onCommit).toHaveBeenCalledWith(0.35);
  });

  it('stores a drag once, when the finger is lifted', async () => {
    const { onChange, onCommit } = await renderSlider();
    const control = screen.getByTestId('volume-control');

    fireEvent(control, 'slidingStart', 0.8);
    fireEvent(control, 'valueChange', 0.6);
    fireEvent(control, 'valueChange', 0.45);

    // The sound follows the finger, but nothing is written on the way.
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onCommit).not.toHaveBeenCalled();

    fireEvent(control, 'slidingComplete', 0.45);

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(0.45);
  });

  it('stores changes again once a drag is over', async () => {
    const { onCommit } = await renderSlider();
    const control = screen.getByTestId('volume-control');

    fireEvent(control, 'slidingStart', 0.8);
    fireEvent(control, 'slidingComplete', 0.5);
    fireEvent(control, 'valueChange', 0.55);

    expect(onCommit).toHaveBeenNthCalledWith(1, 0.5);
    expect(onCommit).toHaveBeenNthCalledWith(2, 0.55);
  });
});
