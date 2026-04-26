import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const STORAGE_KEY = "ai-smart-farmer-firebase-config";

let servicesPromise;

function readBrowserConfig() {
  if (typeof window === "undefined") {
    return null;
  }

  const globalConfig = window.AI_SMART_FARMER_FIREBASE_CONFIG;
  const localValue = window.localStorage.getItem(STORAGE_KEY);

  if (globalConfig && typeof globalConfig === "object") {
    return globalConfig;
  }

  if (!localValue) {
    return null;
  }

  try {
    return JSON.parse(localValue);
  } catch (error) {
    return null;
  }
}

function hasRequiredFirebaseKeys(config) {
  return Boolean(
    config &&
    config.apiKey &&
    config.authDomain &&
    config.projectId &&
    config.appId
  );
}

async function createServices() {
  const config = readBrowserConfig();

  if (!hasRequiredFirebaseKeys(config)) {
    return null;
  }

  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);

  await setPersistence(auth, browserLocalPersistence);

  return {
    app,
    auth,
    db,
    provider: new GoogleAuthProvider(),
  };
}

export async function getFirebaseServices() {
  if (!servicesPromise) {
    servicesPromise = createServices();
  }

  return servicesPromise;
}

export async function isFirebaseAvailable() {
  const services = await getFirebaseServices();
  return Boolean(services);
}

export async function signInWithGooglePopup() {
  const services = await getFirebaseServices();

  if (!services) {
    throw new Error("Firebase configuration is missing. Add AI_SMART_FARMER_FIREBASE_CONFIG to enable Google Sign-In.");
  }

  const result = await signInWithPopup(services.auth, services.provider);
  return result.user;
}

export async function signOutFirebase() {
  const services = await getFirebaseServices();

  if (!services) {
    return;
  }

  await signOut(services.auth);
}

export async function getFirebaseProfile(uid) {
  const services = await getFirebaseServices();

  if (!services || !uid) {
    return null;
  }

  const reference = doc(services.db, "profiles", uid);
  const snapshot = await getDoc(reference);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function saveFirebaseProfile(uid, data) {
  const services = await getFirebaseServices();

  if (!services || !uid) {
    return null;
  }

  const reference = doc(services.db, "profiles", uid);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  await setDoc(reference, payload, { merge: true });
  return payload;
}
