import { messaging } from "../lib/fcm";

export function fellowshipMinistersTopic(fellowshipId: string): string {
  return `fellowship-ministers-${fellowshipId}`;
}

export function userTopic(userId: string): string {
  return `user-${userId}`;
}

export async function notifyFellowshipMinisters(
  fellowshipId: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<void> {
  try {
    await messaging.send({
      topic: fellowshipMinistersTopic(fellowshipId),
      notification: { title, body },
      data,
    });
  } catch (err) {
    console.error("[fcm] Fellowship minister notify failed:", err);
  }
}

export async function notifyUser(
  userId: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<void> {
  try {
    await messaging.send({
      topic: userTopic(userId),
      notification: { title, body },
      data,
    });
  } catch (err) {
    console.error("[fcm] User notify failed:", err);
  }
}
