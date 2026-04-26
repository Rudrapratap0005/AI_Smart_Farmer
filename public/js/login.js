import { loginWithEmailPassword, loginWithGoogle, redirectIfAuthenticated } from "./auth.js";
import { initTheme } from "./theme.js";

function bindLoading(button, loading, idleLabel, busyLabel) {
  button.dataset.loading = loading ? "true" : "false";
  button.disabled = loading;

  if (loading) {
    button.innerHTML = `<span class="loading-spinner"></span> ${busyLabel}`;
  } else {
    button.textContent = idleLabel;
  }
}

function showMessage(message, type = "info") {
  const box = document.getElementById("authMessage");
  if (!box) {
    return;
  }

  box.textContent = message;
  box.className = `mini-panel ${type}`;
}

async function handleEmailLogin(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const submitButton = document.getElementById("loginSubmit");

  if (!email || !password) {
    showMessage("Enter your email and password to continue.", "error");
    return;
  }

  bindLoading(submitButton, true, "Sign In", "Signing in");

  try {
    await loginWithEmailPassword(email, password);
    window.location.href = "/index.html";
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    bindLoading(submitButton, false, "Sign In", "Signing in");
  }
}

async function handleGoogleLogin() {
  const googleButton = document.getElementById("googleLogin");
  bindLoading(googleButton, true, "Continue with Google", "Connecting");

  try {
    await loginWithGoogle();
    window.location.href = "/index.html";
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    bindLoading(googleButton, false, "Continue with Google", "Connecting");
  }
}

function init() {
  if (redirectIfAuthenticated()) {
    return;
  }

  initTheme();
  document.getElementById("loginForm").addEventListener("submit", handleEmailLogin);
  document.getElementById("googleLogin").addEventListener("click", handleGoogleLogin);
}

init();
