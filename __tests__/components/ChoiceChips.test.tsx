import { fireEvent, screen, within } from '@testing-library/react-native';

import { ChoiceChips, type ChoiceOption } from '@/components/ui';
import { TOUCH_TARGET } from '@/constants/theme';
import { translate, translateCount } from '@/i18n';
import type { ThemePreference } from '@/types';

import { renderWithStore } from '../helpers/render';

const GROUP_LABEL = translate('en', 'settings.appearance.title');
const LIGHT = translate('en', 'settings.appearance.light');
const DARK = translate('en', 'settings.appearance.dark');
const SYSTEM = translate('en', 'settings.appearance.system');

const THEME_OPTIONS: ChoiceOption<ThemePreference>[] = [
  { value: 'light', label: LIGHT },
  { value: 'dark', label: DARK },
  { value: 'system', label: SYSTEM },
];

function noop(): void {
  // The tests that care about the choice use their own mock.
}

describe('ChoiceChips', () => {
  it('is announced as one group of options', async () => {
    await renderWithStore(
      <ChoiceChips
        options={THEME_OPTIONS}
        value="system"
        onChange={noop}
        accessibilityLabel={GROUP_LABEL}
      />,
    );

    // The group carries the name and the role but is not itself focusable:
    // making it one element would hide the chips from screen readers.
    const group = screen.getByLabelText(GROUP_LABEL);
    expect(group).toHaveProp('accessibilityRole', 'radiogroup');
    expect(within(group).getAllByRole('radio')).toHaveLength(3);
  });

  it('marks only the chosen option as selected', async () => {
    await renderWithStore(
      <ChoiceChips
        options={THEME_OPTIONS}
        value="dark"
        onChange={noop}
        accessibilityLabel={GROUP_LABEL}
      />,
    );

    expect(screen.getByRole('radio', { name: DARK })).toBeChecked();
    expect(screen.getByRole('radio', { name: DARK })).toBeSelected();
    expect(screen.getByRole('radio', { name: LIGHT })).not.toBeChecked();
  });

  it('marks nothing while no choice has been made', async () => {
    await renderWithStore(
      <ChoiceChips
        options={THEME_OPTIONS}
        value={null}
        onChange={noop}
        accessibilityLabel={GROUP_LABEL}
      />,
    );

    for (const chip of screen.getAllByRole('radio')) {
      expect(chip).not.toBeChecked();
    }
  });

  it('reports the value behind the chip that was pressed', async () => {
    const onChange = jest.fn<void, [ThemePreference]>();
    await renderWithStore(
      <ChoiceChips
        options={THEME_OPTIONS}
        value="system"
        onChange={onChange}
        accessibilityLabel={GROUP_LABEL}
        testID="theme"
      />,
    );

    fireEvent.press(screen.getByTestId('theme-light'));

    expect(onChange).toHaveBeenCalledWith('light');
  });

  it('reports the chosen option again, so pressing it twice is not swallowed', async () => {
    const onChange = jest.fn<void, [ThemePreference]>();
    await renderWithStore(
      <ChoiceChips
        options={THEME_OPTIONS}
        value="dark"
        onChange={onChange}
        accessibilityLabel={GROUP_LABEL}
        testID="theme"
      />,
    );

    fireEvent.press(screen.getByTestId('theme-dark'));

    expect(onChange).toHaveBeenCalledWith('dark');
  });

  it('works with numbers as well as names', async () => {
    const onChange = jest.fn<void, [number]>();
    const targets: ChoiceOption<number>[] = [
      { value: 33, label: '33' },
      { value: 99, label: '99' },
    ];
    await renderWithStore(
      <ChoiceChips
        options={targets}
        value={33}
        onChange={onChange}
        accessibilityLabel={translate('en', 'common.targetPicker.label')}
        testID="target"
      />,
    );

    fireEvent.press(screen.getByTestId('target-99'));

    expect(onChange).toHaveBeenCalledWith(99);
  });

  it('reads out a fuller label while still showing the short one', async () => {
    const spoken = translateCount('en', 'common.targetPicker.times', 99);
    const options: ChoiceOption<number>[] = [
      { value: 99, label: '99', accessibilityLabel: spoken },
    ];
    await renderWithStore(
      <ChoiceChips
        options={options}
        value={99}
        onChange={noop}
        accessibilityLabel={translate('en', 'common.targetPicker.label')}
      />,
    );

    expect(screen.getByRole('radio', { name: spoken })).toBeOnTheScreen();
    expect(screen.getByText('99')).toBeOnTheScreen();
  });

  /* A group that cannot be used yet still says what is chosen; blanking the
     selection would leave the user tapping at something that never answers. */
  it('still shows the choice while it cannot be changed', async () => {
    const onChange = jest.fn<void, [ThemePreference]>();
    await renderWithStore(
      <ChoiceChips
        options={THEME_OPTIONS}
        value="dark"
        onChange={onChange}
        accessibilityLabel={GROUP_LABEL}
        disabled
        testID="theme"
      />,
    );

    expect(screen.getByTestId('theme-dark')).toBeChecked();
    expect(screen.getByTestId('theme-light')).toBeDisabled();

    fireEvent.press(screen.getByTestId('theme-light'));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps every chip above the smallest comfortable touch target', async () => {
    await renderWithStore(
      <ChoiceChips
        options={THEME_OPTIONS}
        value="system"
        onChange={noop}
        accessibilityLabel={GROUP_LABEL}
        testID="theme"
      />,
    );

    expect(screen.getByTestId('theme-system')).toHaveStyle({ minHeight: TOUCH_TARGET.normal });
  });
});
