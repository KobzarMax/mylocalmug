import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { safeErrorMessage } from '../../lib/errors';

import { getBusinessEvents, saveEventMenuLink } from './api';
import { EventChoice, MenuChoice } from './types';
import { eventMenuLinkSchema } from './validation';

const defaultBadge = 'Event special';
const defaultMessage = 'Available for a limited time as part of this event.';

export function useEventMenuLinkForm(businessId: string, menu: MenuChoice[]) {
  const eventsQuery = useQuery({
    queryKey: ['rewards', 'event-choices', businessId],
    queryFn: () => getBusinessEvents(businessId),
    meta: { persist: false },
    staleTime: 0,
  });
  const [eventId, setEventId] = useState('');
  const [itemId, setItemId] = useState('');
  const [badge, setBadge] = useState(defaultBadge);
  const [message, setMessage] = useState(defaultMessage);
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableUntil, setAvailableUntil] = useState('');
  const [eventOnly, setEventOnly] = useState(true);
  const [complete, setComplete] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);
  useEffect(() => {
    if (events.some((event) => event.id === eventId)) return;
    const first = events[0];
    if (first) selectEvent(first, setEventId, setAvailableFrom, setAvailableUntil);
    else setEventId('');
  }, [eventId, events]);
  useEffect(() => {
    if (menu.some((item) => item.id === itemId)) return;
    setItemId(menu[0]?.id ?? '');
  }, [itemId, menu]);

  const mutation = useMutation({
    mutationFn: saveEventMenuLink,
    onSuccess: () => setComplete(true),
  });
  const chooseEvent = (event: EventChoice) =>
    selectEvent(event, setEventId, setAvailableFrom, setAvailableUntil);
  const submit = async () => {
    setValidationError(null);
    const parsed = eventMenuLinkSchema.safeParse({
      eventId,
      menuItemId: itemId,
      badge,
      message,
      availableFrom,
      availableUntil,
      eventOnly,
    });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? 'Check the event item details.');
      return;
    }
    await mutation.mutateAsync(parsed.data);
  };

  return {
    events,
    eventId,
    itemId,
    badge,
    message,
    availableFrom,
    availableUntil,
    eventOnly,
    loading: eventsQuery.isLoading,
    busy: mutation.isPending,
    complete,
    error: validationError
      ? validationError
      : eventsQuery.error
        ? safeErrorMessage(eventsQuery.error, 'Could not load available events.')
        : mutation.error
          ? safeErrorMessage(
              mutation.error,
              'Could not link this menu item. Check the details and try again.',
            )
          : null,
    chooseEvent,
    setItemId,
    setBadge,
    setMessage,
    setAvailableFrom,
    setAvailableUntil,
    setEventOnly,
    retry: () => void eventsQuery.refetch(),
    submit,
  };
}

function selectEvent(
  event: EventChoice,
  setEventId: (value: string) => void,
  setAvailableFrom: (value: string) => void,
  setAvailableUntil: (value: string) => void,
) {
  setEventId(event.id);
  setAvailableFrom(event.startsAt);
  setAvailableUntil(event.endsAt ?? new Date(new Date(event.startsAt).getTime() + 86_400_000).toISOString());
}
