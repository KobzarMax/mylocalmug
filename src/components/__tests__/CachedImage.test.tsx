import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { CachedImage } from '../CachedImage';

jest.mock('../../lib/query/QueryProvider', () => ({
  useNetworkStatus: () => ({ isOnline: true, isOffline: false }),
}));

describe('CachedImage fallback', () => {
  it('renders the supplied fallback when no image is available', async () => {
    await render(
      <CachedImage
        uri={null}
        cacheKey="missing"
        style={{ width: 40, height: 40 }}
        accessibilityLabel="Lunch"
        fallback={<Text>Meal fallback</Text>}
      />,
    );
    expect(screen.getByText('Meal fallback')).toBeTruthy();
    expect(screen.getByLabelText('Lunch unavailable')).toBeTruthy();
  });

  it('replaces a failed image with the supplied fallback', async () => {
    await render(
      <CachedImage
        uri="https://example.com/lunch.jpg"
        cacheKey="lunch"
        style={{ width: 40, height: 40 }}
        accessibilityLabel="Lunch"
        fallback={<Text>Meal fallback</Text>}
      />,
    );
    await fireEvent(screen.getByLabelText('Lunch'), 'error', { nativeEvent: {} });
    expect(screen.getByText('Meal fallback')).toBeTruthy();
  });
});
