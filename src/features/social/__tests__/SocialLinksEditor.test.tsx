import { fireEvent, render } from '@testing-library/react-native';

import { SocialLinksEditor } from '../components/SocialLinksEditor';
import { emptySocialLinks } from '../types';

describe('SocialLinksEditor', () => {
  it('edits labelled profile URLs and supports read-only rendering', async () => {
    const onChange = jest.fn();
    const view = await render(
      <SocialLinksEditor editable error={null} onChange={onChange} value={emptySocialLinks()} />,
    );
    fireEvent.changeText(view.getByLabelText('Instagram profile URL'), 'instagram.com/localmug');
    expect(onChange).toHaveBeenCalledWith('instagram', 'instagram.com/localmug');
    await view.rerender(
      <SocialLinksEditor
        editable={false}
        error="Check this URL"
        onChange={onChange}
        value={emptySocialLinks()}
      />,
    );
    expect(view.getByLabelText('Facebook profile URL')).toBeDisabled();
    expect(view.getByText('Check this URL')).toBeTruthy();
  });
});
