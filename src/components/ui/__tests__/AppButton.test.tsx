import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppButton } from '../AppButton';

describe('AppButton', () => {
  it('exposes its label and runs the action', async () => {
    const onPress = jest.fn();
    await render(<AppButton label="Save profile" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Save profile' });
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('announces and enforces its disabled state', async () => {
    const onPress = jest.fn();
    await render(<AppButton disabled label="Publish" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Publish', disabled: true });
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
