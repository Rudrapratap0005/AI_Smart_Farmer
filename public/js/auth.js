import {
  googleAuthRequest,
  loginRequest,
  meRequest,
  registerRequest,
  updateProfileRequest,
} from "./api.js";
import {
  getFirebaseProfile,
  isFirebaseAvailable,
  saveFirebaseProfile,
  signInWithGooglePopup,
  signOutFirebase,
} from "../firebase.js";

const SESSION_KEY = "ai-smart-farmer-session";

function parseJson(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function normalizeUser(user = {}) {
  return {
    id: user.id || user._id || "",
    name: user.name || user.displayName || "Smart Farmer",
    email: user.email || "farmer@example.com",
    avatarUrl: user.avatarUrl || user.photoURL || "",
    provider: user.provider || "local",
    firebaseUid: user.firebaseUid || user.uid || "",
    preferences: {
      theme: user.preferences?.theme || "light",
      locale: user.preferences?.locale || "en",
    },
  };
}

export function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "SF";
}

export function getSession() {
  const savedSession = parseJson(localStorage.getItem(SESSION_KEY), null);

  if (savedSession) {
    return {
      ...savedSession,
      user: normalizeUser(savedSession.user),
    };
  }

  const legacyToken = localStorage.getItem("token");
  const legacyUser = parseJson(localStorage.getItem("user"), null);

  if (!legacyToken && !legacyUser) {
    return null;
  }

  return {
    token: legacyToken || "",
    provider: legacyUser?.provider || "local",
    user: normalizeUser(legacyUser || {}),
  };
}

export function setSession(session) {
  const normalized = {
    token: session.token || "",
    provider: session.provider || "local",
    user: normalizeUser(session.user || {}),
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
  localStorage.setItem("token", normalized.token);
  localStorage.setItem("user", JSON.stringify(normalized.user));
  return normalized;
}

export async function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  await signOutFirebase().catch(() => {});
}

export async function loginWithEmailPassword(email, password) {
  const data = await loginRequest({ email, password });
  return setSession({
    token: data.token,
    provider: data.user?.provider || "local",
    user: data.user,
  });
}

export async function registerWithEmailPassword(name, email, password) {
  const data = await registerRequest({ name, email, password });
  return setSession({
    token: data.token,
    provider: data.user?.provider || "local",
    user: data.user,
  });
}

export async function loginWithGoogle() {
  const firebaseUser = await signInWithGooglePopup();
  const data = await googleAuthRequest({
    name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Smart Farmer",
    email: firebaseUser.email,
    avatarUrl: firebaseUser.photoURL || "",
    firebaseUid: firebaseUser.uid,
  });

  const session = setSession({
    token: data.token,
    provider: "google",
    user: {
      ...data.user,
      avatarUrl: data.user?.avatarUrl || firebaseUser.photoURL || "",
      firebaseUid: firebaseUser.uid,
    },
  });

  await saveFirebaseProfile(firebaseUser.uid, {
    name: session.user.name,
    email: session.user.email,
    avatarUrl: session.user.avatarUrl,
    provider: "google",
    preferences: session.user.preferences,
  }).catch(() => {});

  return session;
}

export async function hydrateSession() {
  const currentSession = getSession();

  if (!currentSession?.token) {
    return currentSession;
  }

  try {
    const profile = await meRequest(currentSession.token);
    const available = await isFirebaseAvailable().catch(() => false);
    const firebaseProfile = available && currentSession.user.firebaseUid
      ? await getFirebaseProfile(currentSession.user.firebaseUid).catch(() => null)
      : null;

    return setSession({
      ...currentSession,
      user: {
        ...profile.user,
        ...firebaseProfile,
        firebaseUid: profile.user.firebaseUid || currentSession.user.firebaseUid,
      },
    });
  } catch (error) {
    await clearSession();
    return null;
  }
}

export async function requireAuth(redirectTo = "/pages/login.html") {
  const session = await hydrateSession();

  if (!session?.token) {
    window.location.href = redirectTo;
    return null;
  }

  return session;
}

export function redirectIfAuthenticated(target = "/index.html") {
  const session = getSession();
  if (session?.token) {
    window.location.href = target;
    return true;
  }
  return false;
}

export async function logout() {
  await clearSession();
  window.location.href = "/pages/login.html";
}

export function renderAvatar(target, user) {
  if (!target) {
    return;
  }

  const safeUser = normalizeUser(user);
  target.innerHTML = "";

  if (safeUser.avatarUrl) {
    const image = document.createElement("img");
    image.src = safeUser.avatarUrl;
    image.alt = safeUser.name;
    image.loading = "lazy";
    target.appendChild(image);
    return;
  }

  target.textContent = getInitials(safeUser.name);
}

export function populateUserUI(user) {
  const safeUser = normalizeUser(user);
  const label = safeUser.name.split(" ")[0];

  document.querySelectorAll("#profileLabel").forEach((node) => {
    node.textContent = label;
  });
  document.querySelectorAll("#profileRole").forEach((node) => {
    node.textContent = safeUser.provider === "google" ? "Google workspace" : "Field owner";
  });
  document.querySelectorAll("#profileName").forEach((node) => {
    node.textContent = safeUser.name;
  });
  document.querySelectorAll("#profileEmail").forEach((node) => {
    node.textContent = safeUser.email;
  });

  renderAvatar(document.getElementById("profileAvatar"), safeUser);
  renderAvatar(document.getElementById("dropdownAvatar"), safeUser);
  renderAvatar(document.getElementById("profilePageAvatar"), safeUser);
}

export async function updateProfile(payload) {
  const session = getSession();

  if (!session?.token) {
    throw new Error("Authentication required");
  }

  const data = await updateProfileRequest(session.token, payload);
  const mergedSession = setSession({
    ...session,
    user: {
      ...session.user,
      ...data.user,
    },
  });

  if (mergedSession.user.firebaseUid) {
    await saveFirebaseProfile(mergedSession.user.firebaseUid, {
      name: mergedSession.user.name,
      email: mergedSession.user.email,
      avatarUrl: mergedSession.user.avatarUrl,
      preferences: mergedSession.user.preferences,
      provider: mergedSession.user.provider,
    }).catch(() => {});
  }

  return mergedSession;
}
