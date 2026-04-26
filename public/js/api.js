const JSON_HEADERS = {
  "Content-Type": "application/json",
};

export async function apiRequest(path, options = {}) {
  const response = await fetch(path, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export async function loginRequest(payload) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
}

export async function registerRequest(payload) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
}

export async function googleAuthRequest(payload) {
  return apiRequest("/api/auth/google", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
}

export async function meRequest(token) {
  return apiRequest("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateProfileRequest(token, payload) {
  return apiRequest("/api/auth/profile", {
    method: "PUT",
    headers: {
      ...JSON_HEADERS,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchWeatherRequest(params) {
  const url = new URL("/api/weather", window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return apiRequest(url.toString());
}

export async function fetchCropRecommendationRequest(payload) {
  return apiRequest("/api/predict", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
}

export async function fetchPredictionHistoryRequest() {
  return apiRequest("/api/history");
}
