import { fireEvent, screen } from '@testing-library/react-native';

import { TargetPicker } from '@/components/ui';
import { MAX_TARGET, MIN_TARGET } from '@/constants/targets';
import { translate } from '@/i18n';

import { renderWithStore } from '../helpers/render';

const CUSTOM_LABEL = translate('en', 'common.targetPicker.customLabel');

function noop(): void {
  // The tests that care about the target use their own mock.
}

describe('TargetPicker', () => {
  it('offers the common targets and marks the current one', async () => {
    await renderWithStore(
      <TargetPicker value={33} onChange={noop} testID="target" />,
    );

    expect(screen.getByTestId('target-chips-33')).toBeChecked();
    expect(screen.getByTestId('target-chips-99')).not.toBeChecked();
    expect(screen.getByTestId('target-chips-custom')).toBeOnTheScreen();
  });

  it('reports a common target that was chosen', async () => {
    const onChange = jest.fn<void, [number]>();
    const onValidityChange = jest.fn<void, [boolean]>();
    await renderWithStore(
      <TargetPicker
        value={33}
        onChange={onChange}
        onValidityChange={onValidityChange}
        testID="target"
      />,
    );

    fireEvent.press(screen.getByTestId('target-chips-99'));

    expect(onChange).toHaveBeenCalledWith(99);
    expect(onValidityChange).toHaveBeenLastCalledWith(true);
  });

  it('keeps the number field out of the way until Custom is chosen', async () => {
    await renderWithStore(<TargetPicker value={33} onChange={noop} testID="target" />);

    expect(screen.queryByTestId('target-custom-input')).toBeNull();

    fireEvent.press(screen.getByTestId('target-chips-custom'));

    expect(screen.getByTestId('target-custom-input')).toBeOnTheScreen();
    expect(screen.getByText(CUSTOM_LABEL)).toBeOnTheScreen();
  });

  it('says nothing can be saved while the custom field is still empty', async () => {
    const onChange = jest.fn<void, [number]>();
    const onValidityChange = jest.fn<void, [boolean]>();
    await renderWithStore(
      <TargetPicker
        value={33}
        onChange={onChange}
        onValidityChange={onValidityChange}
        testID="target"
      />,
    );

    fireEvent.press(screen.getByTestId('target-chips-custom'));

    expect(onValidityChange).toHaveBeenLastCalledWith(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reports a custom number as it is typed', async () => {
    const onChange = jest.fn<void, [number]>();
    const onValidityChange = jest.fn<void, [boolean]>();
    await renderWithStore(
      <TargetPicker
        value={33}
        onChange={onChange}
        onValidityChange={onValidityChange}
        testID="target"
      />,
    );

    fireEvent.press(screen.getByTestId('target-chips-custom'));
    fireEvent.changeText(screen.getByTestId('target-custom-input'), '250');

    expect(onChange).toHaveBeenCalledWith(250);
    expect(onValidityChange).toHaveBeenLastCalledWith(true);
  });

  it('accepts only digits', async () => {
    const onChange = jest.fn<void, [number]>();
    await renderWithStore(<TargetPicker value={33} onChange={onChange} testID="target" />);

    fireEvent.press(screen.getByTestId('target-chips-custom'));
    fireEvent.changeText(screen.getByTestId('target-custom-input'), '1a2b3');

    expect(onChange).toHaveBeenCalledWith(123);
    expect(screen.getByTestId('target-custom-input')).toHaveDisplayValue('123');
  });

  it('explains a number that is too small', async () => {
    const onValidityChange = jest.fn<void, [boolean]>();
    await renderWithStore(
      <TargetPicker value={33} onChange={noop} onValidityChange={onValidityChange} testID="target" />,
    );

    fireEvent.press(screen.getByTestId('target-chips-custom'));
    fireEvent.changeText(screen.getByTestId('target-custom-input'), '0');

    expect(onValidityChange).toHaveBeenLastCalledWith(false);
    expect(
      screen.getByText(
        translate('en', 'common.targetPicker.errors.tooSmall', { min: MIN_TARGET }),
      ),
    ).toBeOnTheScreen();
  });

  it('explains an empty field once it has been touched', async () => {
    await renderWithStore(<TargetPicker value={33} onChange={noop} testID="target" />);

    fireEvent.press(screen.getByTestId('target-chips-custom'));
    fireEvent.changeText(screen.getByTestId('target-custom-input'), '5');
    fireEvent.changeText(screen.getByTestId('target-custom-input'), '');

    expect(
      screen.getByText(translate('en', 'common.targetPicker.errors.required')),
    ).toBeOnTheScreen();
  });

  it('cannot take more digits than the largest target has', async () => {
    await renderWithStore(<TargetPicker value={33} onChange={noop} testID="target" />);

    fireEvent.press(screen.getByTestId('target-chips-custom'));
    fireEvent.changeText(screen.getByTestId('target-custom-input'), '99999999');

    expect(screen.getByTestId('target-custom-input')).toHaveDisplayValue(
      '9'.repeat(String(MAX_TARGET).length),
    );
  });

  it('opens on the number field when the target is not one of the chips', async () => {
    await renderWithStore(<TargetPicker value={250} onChange={noop} testID="target" />);

    expect(screen.getByTestId('target-chips-custom')).toBeChecked();
    expect(screen.getByTestId('target-custom-input')).toHaveDisplayValue('250');
  });

  it('goes back to a common target and hides the number field', async () => {
    const onChange = jest.fn<void, [number]>();
    await renderWithStore(<TargetPicker value={250} onChange={onChange} testID="target" />);

    fireEvent.press(screen.getByTestId('target-chips-100'));

    expect(onChange).toHaveBeenCalledWith(100);
    expect(screen.queryByTestId('target-custom-input')).toBeNull();
  });
});
