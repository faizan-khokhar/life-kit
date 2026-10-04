import {
  arrayRemove,
  arrayUnion,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase/client";

export async function saveFcmToken(uid: string, token: string): Promise<void> {
  const ref = doc(firestore, "users", uid);
  await setDoc(
    ref,
    {
      fcmTokens: arrayUnion(token),
      fcmUpdatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function removeFcmToken(uid: string, token: string): Promise<void> {
  const ref = doc(firestore, "users", uid);
  await setDoc(
    ref,
    {
      fcmTokens: arrayRemove(token),
      fcmUpdatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
