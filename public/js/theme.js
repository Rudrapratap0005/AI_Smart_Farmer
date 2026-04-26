const THEME_KEY = "ai-smart-farmer-theme";

export function getPreferredTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

export function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem(THEME_KEY, nextTheme);

  const icon = document.querySelector("[data-theme-icon]");
  if (icon) {
    icon.textContent = nextTheme === "dark" ? "☀" : "◐";
  }

  const themeStatus = document.getElementById("heroThemeStatus");
  if (themeStatus) {
    themeStatus.textContent = nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1);
  }
}

export function toggleTheme() {
  const currentTheme = document.documentElement.dataset.theme || "light";
  const nextTheme = currentTheme === "light" ? "dark" : "light";
  applyTheme(nextTheme);
  return nextTheme;
}

export function initTheme() {
  applyTheme(getPreferredTheme());

  const toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      toggleTheme();
    });
  }
}
