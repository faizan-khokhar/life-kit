import {
  deleteToken,
  getToken,
  onMessage,
  type MessagePayload,
  type Messaging,
} from "firebase/messaging";
import { getClientMessaging } from "@/lib/firebase/client";

const SW_PATH = "/firebase-messaging-sw.js";

export async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    return await navigator.serviceWorker.register(SW_PATH);
  } catch {
    return null;
  }
}

export async function getMessagingIfSupported(): Promise<Messaging | null> {
  return getClientMessaging();
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export async function getFcmDeviceToken(): Promise<string | null> {
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY. Add your Web Push certificate key from Firebase Console.",
    );
  }

  const messaging = await getClientMessaging();
  if (!messaging) return null;

  const registration = await registerMessagingServiceWorker();
  if (!registration) return null;

  await navigator.serviceWorker.ready;

  return getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
}

export async function deleteFcmDeviceToken(): Promise<void> {
  const messaging = await getClientMessaging();
  if (!messaging) return;
  await deleteToken(messaging);
}

export function listenForForegroundMessages(
  handler: (payload: MessagePayload) => void,
): () => void {
  let unsubscribe: (() => void) | undefined;
  void getClientMessaging().then((messaging) => {
    if (!messaging) return;
    unsubscribe = onMessage(messaging, handler);
  });
  return () => {
    unsubscribe?.();
  };
}

export function isNotificationApiAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}
