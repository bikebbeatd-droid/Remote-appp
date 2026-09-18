/**
 * Firebase Firestore & Authentication Client
 * Provides Cloud Sync for TV Devices, User Profiles, Custom Decks, and Public Templates
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocFromServer,
  Unsubscribe,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { TvDevice } from "./types";

// 1. Initialize Firebase App and Services
let app: any = null;
let authInstance: any = null;
let dbInstance: any = null;

try {
  if (firebaseConfig && firebaseConfig.apiKey) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(app);
    try {
      initializeFirestore(
        app,
        {
          experimentalAutoDetectLongPolling: true,
        },
        firebaseConfig.firestoreDatabaseId
      );
    } catch {
      // If already initialized
    }
    dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
} catch (err) {
  console.warn("Firebase initialization deferred or offline:", err);
}

export const auth = authInstance;
export const db = dbInstance;

// 2. Strict Error Handling conforming to FirestoreErrorInfo
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 3. Test Connection
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    if (!db) {
      console.warn("Firebase Firestore is not configured; continuing in local-only mode.");
      return false;
    }
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("the client is offline") ||
        error.message.includes("unavailable") ||
        error.message.includes("Could not reach Cloud Firestore backend"))
    ) {
      console.warn("Firestore client is offline or operating in local mode. Please check your Firebase configuration.");
      return false;
    }
    return true;
  }
}

// Automatically test connection on boot
testFirestoreConnection().catch(() => {});

// 4. Authentication Helpers
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function loginWithGoogle(): Promise<User> {
  try {
    if (!auth) {
      throw new Error("Cloud account is unavailable because Firebase is not configured.");
    }
    const result = await signInWithPopup(auth, googleProvider);
    // Sync initial user profile (best-effort)
    if (result.user) {
      try {
        await saveUserProfile({
          userId: result.user.uid,
          email: result.user.email || undefined,
          displayName: result.user.displayName || undefined,
          photoURL: result.user.photoURL || undefined,
        });
      } catch (profileErr) {
        console.warn("Initial profile write note:", profileErr);
      }
    }
    return result.user;
  } catch (err) {
    console.error("Failed to sign in with Google:", err);
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// 5. User Profile Synchronization
export interface UserProfileData {
  userId: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  preferredLayout?: "mobile" | "tv" | "dual";
  preferredRemoteMode?: string;
  hapticsEnabled?: boolean;
  theme?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function saveUserProfile(
  profile: Partial<UserProfileData> & { userId: string }
): Promise<void> {
  const path = `users/${profile.userId}`;
  try {
    const userRef = doc(db, "users", profile.userId);
    let existingData: Record<string, any> | null = null;
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) existingData = snap.data();
    } catch {
      // Ignore if user doc does not exist yet or offline
    }
    const now = new Date().toISOString();
    
    const cleanData: Record<string, any> = {
      userId: profile.userId,
      createdAt: existingData?.createdAt || now,
      updatedAt: now,
    };

    if (profile.email) cleanData.email = profile.email.slice(0, 256);
    if (profile.displayName) cleanData.displayName = profile.displayName.slice(0, 128);
    if (profile.photoURL) cleanData.photoURL = profile.photoURL.slice(0, 2048);
    if (profile.preferredLayout && ["mobile", "tv", "dual"].includes(profile.preferredLayout)) {
      cleanData.preferredLayout = profile.preferredLayout;
    }
    if (profile.preferredRemoteMode) cleanData.preferredRemoteMode = profile.preferredRemoteMode.slice(0, 64);
    if (profile.hapticsEnabled !== undefined && profile.hapticsEnabled !== null) {
      cleanData.hapticsEnabled = Boolean(profile.hapticsEnabled);
    }
    if (profile.theme) cleanData.theme = profile.theme.slice(0, 32);

    await setDoc(userRef, cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadUserProfile(
  userId: string
): Promise<UserProfileData | null> {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    return snap.data() as UserProfileData;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// 6. Device Cloud Synchronization
export async function syncDeviceToCloud(
  userId: string,
  device: TvDevice
): Promise<void> {
  const path = `users/${userId}/devices/${device.id}`;
  try {
    const deviceRef = doc(db, "users", userId, "devices", device.id);
    const now = new Date().toISOString();
    const payload = {
      id: device.id,
      userId: userId,
      name: (device.name || "Smart TV").slice(0, 128),
      ip: (device.ip || "").slice(0, 64),
      port: Number(device.port) || 8080,
      platform: (device.platform || "generic").slice(0, 64),
      protocol: (device.protocol || "http").slice(0, 64),
      isOnline: Boolean(device.isOnline),
      isPaired: Boolean(device.isPaired),
      requiresPairing: Boolean(device.requiresPairing),
      token: (device.token || "").slice(0, 512),
      manufacturer: (device.brand || device.name || "Unknown").slice(0, 128),
      model: (device.model || "Smart TV").slice(0, 128),
      room: "Living Room",
      isFavorite: Boolean(device.isFavorite),
      capabilities: device.capabilities || {},
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(deviceRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDeviceFromCloud(
  userId: string,
  deviceId: string
): Promise<void> {
  const path = `users/${userId}/devices/${deviceId}`;
  try {
    const deviceRef = doc(db, "users", userId, "devices", deviceId);
    await deleteDoc(deviceRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToUserDevices(
  userId: string,
  onUpdate: (devices: TvDevice[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    return () => {};
  }
  const path = `users/${userId}/devices`;
  try {
    const devicesCol = collection(db, "users", userId, "devices");

    return onSnapshot(
      devicesCol,
      (snapshot) => {
        const devices: TvDevice[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: data.id,
            name: data.name,
            model: data.model || "Smart TV",
            brand: data.manufacturer || data.name,
            platform: data.platform || "generic",
            ip: data.ip,
            port: data.port,
            protocol: data.protocol || "http",
            requiresPairing: Boolean(data.requiresPairing),
            isPaired: Boolean(data.isPaired),
            isOnline: Boolean(data.isOnline),
            token: data.token || undefined,
            isFavorite: Boolean(data.isFavorite),
            capabilities: data.capabilities || {
              power: "SUPPORTED",
              navigation: "SUPPORTED",
              volume: "SUPPORTED",
              media: "SUPPORTED",
              keyboard: "SUPPORTED",
              touchpad: "SUPPORTED",
              apps: "SUPPORTED",
              input: "SUPPORTED",
              voice: "UNKNOWN",
              channels: "SUPPORTED",
              ir: "UNSUPPORTED",
              bluetooth: "UNSUPPORTED",
              wifi: "SUPPORTED",
            },
          } as TvDevice;
        });
        onUpdate(devices);
      },
      (error) => {
        if (onError) {
          onError(error);
        } else {
          const msg = error instanceof Error ? error.message : String(error);
          if (
            msg.includes("the client is offline") ||
            msg.includes("unavailable") ||
            msg.includes("Could not reach Cloud Firestore backend")
          ) {
            console.warn("Firestore offline warning in subscribeToUserDevices:", msg);
          } else {
            handleFirestoreError(error, OperationType.GET, path);
          }
        }
      }
    );
  } catch (err: any) {
    console.warn("Could not attach Firestore device listener:", err);
    return () => {};
  }
}

// 7. Auth state hook helper
export function onAuthChanged(callback: (user: User | null) => void): Unsubscribe {
  if (!auth) {
    callback(null);
    return () => {};
  }
  try {
    return onAuthStateChanged(auth, callback);
  } catch (err) {
    console.warn("onAuthStateChanged error:", err);
    callback(null);
    return () => {};
  }
}
