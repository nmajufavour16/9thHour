import admin from "firebase-admin";
// Side-effect import: ensures the Admin SDK app is initialized before we touch messaging().
import "./firebase";

// Clients subscribe to this topic on login so the daily verse reaches every
// device without us storing and fanning out individual FCM tokens.
export const ALL_USERS_TOPIC = "all-users";

export const messaging = admin.messaging();

export async function broadcastToAllUsers(
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<string> {
  return messaging.send({
    topic: ALL_USERS_TOPIC,
    notification: { title, body },
    data,
  });
}
