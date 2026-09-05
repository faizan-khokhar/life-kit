import {
  initializeApp,
  getApps,
  cert,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

if (typeof window !== "undefined") {
  throw new Error(
    "lib/firebase/admin.ts must only be imported from server code (Route Handlers, Server Components). Never import it from client components.",
  );
}

function createAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in .env.local.",
    );
  }

  const serviceAccount: ServiceAccount = {
    projectId,
    clientEmail,
    privateKey,
  };

  return initializeApp({
    credential: cert(serviceAccount),
    projectId,
  });
}

let _adminAuth: Auth | undefined;
let _adminFirestore: Firestore | undefined;

/** Firebase Admin Auth — lazy so missing env vars fail at request time, not import. */
export function getAdminAuth(): Auth {
  if (!_adminAuth) {
    _adminAuth = getAuth(createAdminApp());
  }
  return _adminAuth;
}

/** Firebase Admin Firestore — lazy so missing env vars fail at request time, not import. */
export function getAdminFirestore(): Firestore {
  if (!_adminFirestore) {
    _adminFirestore = getFirestore(createAdminApp());
  }
  return _adminFirestore;
}

/** HLD alias — prefer getAdminAuth() in new code. */
export const adminAuth = {
  verifyIdToken: (...args: Parameters<Auth["verifyIdToken"]>) =>
    getAdminAuth().verifyIdToken(...args),
};

/** HLD alias — prefer getAdminFirestore() in new code. */
export const adminFirestore = {
  collection: (...args: Parameters<Firestore["collection"]>) =>
    getAdminFirestore().collection(...args),
};
