export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  sound: 'default';
  channelId: string;
  data: { contentId: string; url: string };
};

export type ExpoPushTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
};

export function isExpoPushToken(value: string) {
  return /^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$/.test(value);
}

export function uniqueByKey<Value extends { key: string }>(values: Value[]) {
  return [...new Map(values.map((value) => [value.key, value])).values()];
}

export async function sendExpoMessages(
  messages: ExpoPushMessage[],
  fetcher: typeof fetch = fetch,
): Promise<ExpoPushTicket[]> {
  if (messages.length > 100) throw new Error('Expo push batches cannot exceed 100 messages.');
  const response = await fetcher('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(messages),
  });
  if (!response.ok) throw new Error(`Expo push request failed with ${response.status}`);
  const payload = await response.json() as { data?: ExpoPushTicket[] };
  if (!Array.isArray(payload.data) || payload.data.length !== messages.length) {
    throw new Error('Expo returned an unexpected push-ticket response.');
  }
  return payload.data;
}

