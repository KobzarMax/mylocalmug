import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { ContentDetail } from './types';

const channelId = 'events';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForEventNotifications(requestPermission: boolean) {
  if (!Device.isDevice) throw new Error('Push notifications require a physical device.');
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') throw new Error('Push notifications are unavailable on this platform.');
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(channelId, {
      name: 'Coffee shop events',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  let permissions = await Notifications.getPermissionsAsync();
  if (requestPermission && permissions.status !== 'granted') {
    permissions = await Notifications.requestPermissionsAsync();
  }
  if (permissions.status !== 'granted') return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error('Push notifications need an EAS project ID in app configuration.');
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return { token: token.data, platform: Platform.OS as 'ios' | 'android' };
}

export function subscribeToContentNotifications(onOpen: (contentId: string) => void) {
  const open = (response: Notifications.NotificationResponse | null) => {
    const contentId = response?.notification.request.content.data?.contentId;
    if (typeof contentId === 'string') onOpen(contentId);
  };
  open(Notifications.getLastNotificationResponse());
  return Notifications.addNotificationResponseReceivedListener(open);
}

export async function addEventToCalendar(event: ContentDetail) {
  if (event.kind !== 'event' || !event.eventStartsAt) throw new Error('This content is not a dated event.');
  const permission = await Calendar.requestCalendarPermissions(true);
  if (permission.status !== 'granted') throw new Error('Allow calendar access to add this event.');

  let calendar: Calendar.ExpoCalendar | undefined;
  if (Platform.OS === 'ios') {
    calendar = Calendar.getDefaultCalendarSync();
  } else {
    const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
    calendar = calendars.find((candidate) => candidate.allowsModifications && candidate.isPrimary)
      ?? calendars.find((candidate) => candidate.allowsModifications);
  }
  if (!calendar) throw new Error('No writable calendar is available on this device.');

  const startDate = new Date(event.eventStartsAt);
  const endDate = event.eventEndsAt
    ? new Date(event.eventEndsAt)
    : new Date(startDate.getTime() + (event.eventAllDay ? 86_400_000 : 3_600_000));
  return calendar.addEventWithForm({
    title: event.title,
    startDate,
    endDate,
    allDay: event.eventAllDay,
    location: [event.eventVenueName, event.eventVenueAddress].filter(Boolean).join(', '),
    notes: `${event.excerpt}\n\nOpen in Local Mug: localmug://content/${event.id}`,
    url: `localmug://content/${event.id}`,
  });
}
