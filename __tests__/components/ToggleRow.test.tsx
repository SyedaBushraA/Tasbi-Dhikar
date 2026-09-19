import { fireEvent, screen } from '@testing-library/react-native';

import { ToggleRow } from '@/components/ui';
import { SPACING, TOUCH_TARGET } from '@/constants/theme';
import { translate } from '@/i18n';

import { renderWithStore } from '../helpers/render';

const TITLE = translate('en', 'settings.easyMode.title');
const DESCRIPTION = translate('en', 'settings.easyMode.description');
const ON = translate('en', 'common.on');
const OFF = translate('en', 'common.off');

function noop(): void {
  // The tests that care about the change use their own mock.
}

describe('ToggleRow', () => {
  it('is announced as one switch carrying its title', async () => {
    await renderWithStore(
      <ToggleRow title={TITLE} description={DESCRIPTION} value={false} onValueChange={noop} />,
    );

    expect(screen.getByRole('switch', { name: TITLE })).toBeOnTheScreen();
  });

  it('writes the state out, so it never depends on colour alone', async () => {
    const { rerender } = await renderWithStore(
      <ToggleRow title={TITLE} value={false} onValueChange={noop} />,
    );

    expect(screen.getByText(OFF)).toBeOnTheScreen();
    expect(screen.queryByText(ON)).toBeNull();

    rerender(<ToggleRow title={TITLE} value onValueChange={noop} />);

    expect(screen.getByText(ON)).toBeOnTheScreen();
    expect(screen.queryByText(OFF)).toBeNull();
  });

  it('tells a screen reader whether it is on', async () => {
    const { rerender } = await renderWithStore(
      <ToggleRow title={TITLE} value={false} onValueChange={noop} />,
    );

    expect(screen.getByRole('switch', { name: TITLE })).not.toBeChecked();

    rerender(<ToggleRow title={TITLE} value onValueChange={noop} />);

    expect(screen.getByRole('switch', { name: TITLE })).toBeChecked();
  });

  it('shows the description and offers it as the hint', async () => {
    await renderWithStore(
      <ToggleRow title={TITLE} description={DESCRIPTION} value={false} onValueChange={noop} />,
    );

    expect(screen.getByText(DESCRIPTION)).toBeOnTheScreen();
    expect(screen.getByRole('switch', { name: TITLE })).toHaveProp(
      'accessibilityHint',
      DESCRIPTION,
    );
  });

  it('asks for the opposite of what it shows when the row is pressed', async () => {
    const onValueChange = jest.fn<void, [boolean]>();
    const { rerender } = await renderWithStore(
      <ToggleRow title={TITLE} value={false} onValueChange={onValueChange} testID="toggle" />,
    );

    fireEvent.press(screen.getByTestId('toggle'));
    expect(onValueChange).toHaveBeenCalledWith(true);

    rerender(<ToggleRow title={TITLE} value onValueChange={onValueChange} testID="toggle" />);
    fireEvent.press(screen.getByTestId('toggle'));

    expect(onValueChange).toHaveBeenLastCalledWith(false);
  });

  it('cannot be changed while it is disabled', async () => {
    const onValueChange = jest.fn<void, [boolean]>();
    await renderWithStore(
      <ToggleRow
        title={TITLE}
        value={false}
        onValueChange={onValueChange}
        disabled
        testID="toggle"
      />,
    );

    const row = screen.getByTestId('toggle');
    expect(row).toBeDisabled();

    fireEvent.press(row);

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('stays above the smallest comfortable touch target', async () => {
    await renderWithStore(
      <ToggleRow title={TITLE} value={false} onValueChange={noop} testID="toggle" />,
    );

    expect(screen.getByTestId('toggle')).toHaveStyle({
      minHeight: TOUCH_TARGET.normal + SPACING.sm,
    });
  });

  it('grows with Easy Mode', async () => {
    await renderWithStore(
      <ToggleRow title={TITLE} value={false} onValueChange={noop} testID="toggle" />,
      { state: { settings: { easyMode: true } } },
    );

    expect(screen.getByTestId('toggle')).toHaveStyle({
      minHeight: TOUCH_TARGET.easy + SPACING.sm,
    });
  });
});
