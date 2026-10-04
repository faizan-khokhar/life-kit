/* eslint-disable no-undef */
/**
 * Firebase Cloud Messaging service worker for LifeKit web push.
 * Config is loaded from /firebase-messaging-config.js (env-driven route).
 */
importScripts(
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js",
);
importScripts("/firebase-messaging-config.js");

firebase.initializeApp(self.__FIREBASE_CONFIG__);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title =
    payload.notification?.title || payload.data?.title || "LifeKit";
  const body =
    payload.notification?.body || payload.data?.body || "You have a reminder.";
  const url = payload.data?.url || "/";

  self.registration.showNotification(title, {
    body,
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: { url },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client && client.url.includes(self.location.origin)) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
      return undefined;
    }),
  );
});
