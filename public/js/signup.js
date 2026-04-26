import { loginWithGoogle, redirectIfAuthenticated, registerWithEmailPassword } from "./auth.js";
import { initTheme } from "./theme.js";

function bindLoading(button, loading, idleLabel, busyLabel) {
  button.dataset.loading = loading ? "true" : "false";
  button.disabled = loading;
  button.innerHTML = loading ? `<span class="loading-spinner"></span> ${busyLabel}` : idleLabel;
}

function showMessage(message, type = "info") {
  const box = document.getElementById("authMessage");
  box.textContent = message;
  box.className = `mini-panel ${type}`;
}

async function handleSignup(event) {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();
  const submitButton = document.getElementById("signupSubmit");

  if (!name || !email || !password || !confirmPassword) {
    showMessage("Complete all fields to create your workspace.", "error");
    return;
  }

  if (password !== confirmPassword) {
    showMessage("Passwords do not match.", "error");
    return;
  }

  bindLoading(submitButton, true, "Create Account", "Creating");

  try {
    await registerWithEmailPassword(name, email, password);
    window.location.href = "/index.html";
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    bindLoading(submitButton, false, "Create Account", "Creating");
  }
}

async function handleGoogleSignup() {
  const button = document.getElementById("googleSignup");
  bindLoading(button, true, "Continue with Google", "Connecting");

  try {
    await loginWithGoogle();
    window.location.href = "/index.html";
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    bindLoading(button, false, "Continue with Google", "Connecting");
  }
}

function init() {
  if (redirectIfAuthenticated()) {
    return;
  }

  initTheme();
  document.getElementById("signupForm").addEventListener("submit", handleSignup);
  document.getElementById("googleSignup").addEventListener("click", handleGoogleSignup);
}

init();
