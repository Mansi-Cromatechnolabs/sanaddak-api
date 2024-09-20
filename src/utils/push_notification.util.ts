import * as admin from 'firebase-admin';

/**
 * Utility function to send Firebase Cloud Messaging (FCM) push notifications.
 *
 * @param {string} fcmToken - The FCM token of the target device.
 * @param {string} title - Title of the notification.
 * @param {string} body - Body content of the notification.
 * @param {any} [data] - Optional data payload for custom data to be sent with the notification.
 * @returns {Promise<any>} - The response from Firebase or an error if sending fails.
 */
export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  body: string,
  data?: any,
): Promise<any> => {
  const message = {
    notification: {
      title,
      body,
    },
    data: data || {},
    token: fcmToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    // throw error; // Re-throw error to be handled by the caller
    return false;
  }
};
