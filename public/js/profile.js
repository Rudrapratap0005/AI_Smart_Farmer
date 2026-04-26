import { getSession, logout, populateUserUI, requireAuth, updateProfile } from "./auth.js";
import { applyTheme, initTheme } from "./theme.js";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function bindLoading(button, loading, idleLabel, busyLabel) {
  button.dataset.loading = loading ? "true" : "false";
  button.disabled = loading;
  button.innerHTML = loading ? `<span class="loading-spinner"></span> ${busyLabel}` : idleLabel;
}

function showMessage(message, type = "info") {
  const box = document.getElementById("profileMessage");
  box.textContent = message;
  box.className = `mini-panel ${type}`;
}

function syncSummary(session) {
  populateUserUI(session.user);
  document.getElementById("profileNameHeading").textContent = session.user.name;
  document.getElementById("profileEmailHeading").textContent = session.user.email;
  document.getElementById("profileProvider").textContent = session.user.provider === "google" ? "Google workspace" : "Email workspace";
  document.getElementById("nameInput").value = session.user.name;
  document.getElementById("emailInput").value = session.user.email;
  document.getElementById("localeInput").value = session.user.preferences?.locale || "en";
  document.getElementById("themeInput").value = session.user.preferences?.theme || "light";
}

async function handleProfileSave(event) {
  event.preventDefault();

  const button = document.getElementById("saveProfileBtn");
  const file = document.getElementById("avatarInput").files[0];
  let avatarUrl = getSession()?.user?.avatarUrl || "";

  bindLoading(button, true, "Save Changes", "Saving");

  try {
    if (file) {
      avatarUrl = await readFileAsDataUrl(file);
    }

    const updatedSession = await updateProfile({
      name: document.getElementById("nameInput").value.trim(),
      avatarUrl,
      locale: document.getElementById("localeInput").value,
      theme: document.getElementById("themeInput").value,
    });

    applyTheme(updatedSession.user.preferences?.theme || "light");
    syncSummary(updatedSession);
    showMessage("Profile updated successfully.", "success");
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    bindLoading(button, false, "Save Changes", "Saving");
  }
}

async function init() {
  initTheme();

  const session = await requireAuth();
  if (!session) {
    return;
  }

  syncSummary(session);
  document.getElementById("profileForm").addEventListener("submit", handleProfileSave);
  document.getElementById("logoutProfileBtn").addEventListener("click", logout);
}

init();
