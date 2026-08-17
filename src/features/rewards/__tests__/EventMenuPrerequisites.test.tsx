import { fireEvent, render, screen } from '@testing-library/react-native';

import { EventMenuPrerequisites } from '../components/EventMenuPrerequisites';

describe('EventMenuPrerequisites', () => {
  it('explains both requirements and links to both creation flows', async () => {
    const createEvent = jest.fn();
    const createMenuItem = jest.fn();
    await render(
      <EventMenuPrerequisites
        hasEvents={false}
        hasMenuItems={false}
        onCreateEvent={createEvent}
        onCreateMenuItem={createMenuItem}
      />,
    );

    expect(screen.getByText(/at least one event and one menu item/i)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Create an event' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Create a menu item' }));
    expect(createEvent).toHaveBeenCalledTimes(1);
    expect(createMenuItem).toHaveBeenCalledTimes(1);
  });

  it('shows only the action for the missing prerequisite', async () => {
    await render(
      <EventMenuPrerequisites
        hasEvents
        hasMenuItems={false}
        onCreateEvent={jest.fn()}
        onCreateMenuItem={jest.fn()}
      />,
    );

    expect(screen.queryByText('Create an event')).toBeNull();
    expect(screen.getByRole('button', { name: 'Create a menu item' })).toBeTruthy();
  });
});
