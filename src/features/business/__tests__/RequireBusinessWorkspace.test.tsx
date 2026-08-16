import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { RequireBusinessWorkspace } from '../RequireBusinessWorkspace';
import { Workspace } from '../types';

const mockUseWorkspace = jest.fn<unknown, []>();

jest.mock('../BusinessWorkspaceProvider', () => ({ useBusinessWorkspace: () => mockUseWorkspace() }));

const workspace = {
  role: 'viewer',
  business: { id: 'business-id' },
} as Workspace;

describe('business route permissions', () => {
  it('shows an intentional denial for a missing permission', async () => {
    mockUseWorkspace.mockReturnValue({ loading: false, error: null, workspace });
    const view = await render(
      <RequireBusinessWorkspace permission="menu.manage">
        {() => <Text>private menu</Text>}
      </RequireBusinessWorkspace>,
    );
    expect(view.getByText('Access not available')).toBeOnTheScreen();
    expect(view.queryByText('private menu')).toBeNull();
  });

  it('renders an allowed workspace route', async () => {
    mockUseWorkspace.mockReturnValue({
      loading: false,
      error: null,
      workspace: { ...workspace, role: 'manager' },
    });
    const view = await render(
      <RequireBusinessWorkspace permission="menu.manage">
        {() => <Text>private menu</Text>}
      </RequireBusinessWorkspace>,
    );
    expect(view.getByText('private menu')).toBeOnTheScreen();
  });
});
