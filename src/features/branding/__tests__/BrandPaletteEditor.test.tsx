import { fireEvent, render } from '@testing-library/react-native';

import { BrandPaletteEditor } from '../components/BrandPaletteEditor';
import { DEFAULT_BUSINESS_PALETTE } from '../theme';

describe('BrandPaletteEditor', () => {
  it('supports accessible swatches, hex editing, errors, and reset', async () => {
    const onChange = jest.fn();
    const onReset = jest.fn();
    const view = await render(
      <BrandPaletteEditor
        editable
        error="Primary must contrast with the background."
        name="Test café"
        onChange={onChange}
        onReset={onReset}
        value={DEFAULT_BUSINESS_PALETTE}
      />,
    );

    fireEvent.changeText(view.getByLabelText('primary brand colour hex value'), '#2F5D8A');
    expect(onChange).toHaveBeenCalledWith('primary', '#2F5D8A');
    fireEvent.press(view.getByRole('radio', { name: 'Use #2F5D8A as primary' }));
    expect(onChange).toHaveBeenCalledWith('primary', '#2F5D8A');
    expect(view.getByText('Primary must contrast with the background.')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Reset brand colours' }));
    expect(onReset).toHaveBeenCalledTimes(1);
    await view.rerender(
      <BrandPaletteEditor
        editable={false}
        error={null}
        name="Test café"
        onChange={jest.fn()}
        onReset={jest.fn()}
        value={DEFAULT_BUSINESS_PALETTE}
      />,
    );
    expect(view.getByLabelText('primary brand colour hex value')).toBeDisabled();
    expect(view.queryByRole('button', { name: 'Reset brand colours' })).toBeNull();
  });
});
