"use client";

import { useCallback, useEffect, useState } from "react";
import {
  removeFcmToken,
  saveFcmToken,
} from "@/features/settings/data/push-tokens";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  deleteFcmDeviceToken,
  getFcmDeviceToken,
  isNotificationApiAvailable,
  requestNotificationPermission,
} from "@/lib/firebase/messaging";

export type PushStatus =
  | "loading"
  | "unsupported"
  | "denied"
  | "default"
  | "enabled"
  | "disabled";

const TOKEN_STORAGE_KEY = "lifekit.fcmToken";

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

function writeStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function usePushNotifications() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [status, setStatus] = useState<PushStatus>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNotificationApiAvailable()) {
      setStatus("unsupported");
      return;
    }

    const permission = Notification.permission;
    if (permission === "denied") {
      setStatus("denied");
      return;
    }

    const stored = readStoredToken();
    if (permission === "granted" && stored) {
      setStatus("enabled");
      return;
    }

    if (permission === "granted") {
      setStatus("disabled");
      return;
    }

    setStatus("default");
  }, [uid]);

  const enable = useCallback(async () => {
    if (!uid) {
      setError("Sign in to enable notifications.");
      return false;
    }
    if (!isNotificationApiAvailable()) {
      setStatus("unsupported");
      return false;
    }

    setBusy(true);
    setError(null);
    try {
      const permission = await requestNotificationPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "default");
        setError(
          permission === "denied"
            ? "Notifications are blocked in the browser."
            : "Permission was not granted.",
        );
        return false;
      }

      const token = await getFcmDeviceToken();
      if (!token) {
        setError("Could not get a push token on this device.");
        setStatus("disabled");
        return false;
      }

      await saveFcmToken(uid, token);
      writeStoredToken(token);
      setStatus("enabled");
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to enable notifications.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }, [uid]);

  const disable = useCallback(async () => {
    if (!uid) return false;
    setBusy(true);
    setError(null);
    try {
      const stored = readStoredToken();
      if (stored) {
        await removeFcmToken(uid, stored);
      }
      try {
        await deleteFcmDeviceToken();
      } catch {
        // Token may already be invalid locally.
      }
      writeStoredToken(null);
      const permission =
        typeof Notification !== "undefined"
          ? Notification.permission
          : "default";
      setStatus(permission === "denied" ? "denied" : "disabled");
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to disable notifications.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }, [uid]);

  return {
    status,
    busy,
    error,
    enabled: status === "enabled",
    enable,
    disable,
  };
}
