import admin from '../config/firebase';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendPushToDevice(fcmToken: string, payload: PushNotificationPayload): Promise<void> {
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
    });
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

export async function sendPushToDevices(fcmTokens: string[], payload: PushNotificationPayload): Promise<void> {
  if (fcmTokens.length === 0) return;

  try {
    await admin.messaging().sendEachForMulticast({
      tokens: fcmTokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
    });
  } catch (error) {
    console.error('Failed to send multicast push:', error);
  }
}

export async function sendPushToTopic(topic: string, payload: PushNotificationPayload): Promise<void> {
  try {
    await admin.messaging().send({
      topic,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
    });
  } catch (error) {
    console.error('Failed to send topic push:', error);
  }
}
