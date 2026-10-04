import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore, getAdminMessaging } from "@/lib/firebase/admin";

export type ReminderPayload = {
  title: string;
  body: string;
  url: string;
};

export type SendRemindersResult = {
  ok: boolean;
  attempted: number;
  success: number;
  failure: number;
};

type TokenOwner = {
  uid: string;
  token: string;
};

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

async function listTokenOwners(): Promise<TokenOwner[]> {
  const db = getAdminFirestore();
  const snap = await db.collection("users").get();
  const owners: TokenOwner[] = [];

  for (const docSnap of snap.docs) {
    const tokens = docSnap.data().fcmTokens;
    if (!Array.isArray(tokens)) continue;
    for (const token of tokens) {
      if (typeof token === "string" && token.length > 0) {
        owners.push({ uid: docSnap.id, token });
      }
    }
  }

  return owners;
}

async function pruneInvalidToken(uid: string, token: string): Promise<void> {
  const db = getAdminFirestore();
  await db.collection("users").doc(uid).set(
    {
      fcmTokens: FieldValue.arrayRemove(token),
      fcmUpdatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

/** Send a web push reminder to every user with at least one FCM token. */
export async function sendReminderToAll(
  payload: ReminderPayload,
): Promise<SendRemindersResult> {
  const owners = await listTokenOwners();
  if (owners.length === 0) {
    return { ok: true, attempted: 0, success: 0, failure: 0 };
  }

  const messaging = getAdminMessaging();
  let success = 0;
  let failure = 0;

  for (const batch of chunk(owners, 500)) {
    const tokens = batch.map((o) => o.token);
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        title: payload.title,
        body: payload.body,
        url: payload.url,
      },
      webpush: {
        fcmOptions: {
          link: payload.url,
        },
        notification: {
          icon: "/icon.svg",
        },
      },
    });

    success += response.successCount;
    failure += response.failureCount;

    response.responses.forEach((res, index) => {
      if (res.success) return;
      const code = res.error?.code;
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token"
      ) {
        const owner = batch[index];
        if (owner) {
          void pruneInvalidToken(owner.uid, owner.token);
        }
      }
    });
  }

  return {
    ok: failure === 0,
    attempted: owners.length,
    success,
    failure,
  };
}
