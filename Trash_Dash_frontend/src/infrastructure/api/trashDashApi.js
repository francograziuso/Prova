// Infrastructure layer: adapter HTTP verso backend TrashDash.
import { NativeModules } from "react-native";

const API_REQUEST_TIMEOUT_MS = 10000;
const API_HEALTH_TIMEOUT_MS = 2500;

function getExpoHost() {
  const scriptURL = NativeModules?.SourceCode?.scriptURL || "";
  const match = scriptURL.match(/^(?:https?|exp):\/\/([^/:?#]+)/i);
  return match?.[1] || "";
}

function normalizeApiBaseUrl(value) {
  const normalized = String(value || "").trim().replace(/\/+$/, "");
  if (!normalized) return "";
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
}

function buildApiBaseUrlCandidates() {
  const candidates = [];
  const addCandidate = (value) => {
    const normalized = normalizeApiBaseUrl(value);
    if (normalized && !candidates.includes(normalized)) candidates.push(normalized);
  };

  addCandidate(process.env.EXPO_PUBLIC_API_BASE_URL);

  const expoHost = getExpoHost();
  if (expoHost) addCandidate(`http://${expoHost}:4000/api`);

  addCandidate("http://10.0.2.2:4000/api");
  addCandidate("http://localhost:4000/api");

  return candidates;
}

const API_BASE_URL_CANDIDATES = buildApiBaseUrlCandidates();
let activeApiBaseUrl = API_BASE_URL_CANDIDATES[0] || normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL) || "http://10.0.2.2:4000/api";
let apiBaseUrlVerified = API_BASE_URL_CANDIDATES.length <= 1;
export const API_BASE_URL = activeApiBaseUrl;

function isNetworkError(error) {
  const message = String(error?.message || "");
  return (
    error?.name === "AbortError" ||
    /network request failed|failed to fetch|networkerror|load failed/i.test(message)
  );
}

async function fetchWithTimeout(url, options = {}, timeoutMs = API_REQUEST_TIMEOUT_MS) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller && timeoutMs
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    return await fetch(url, {
      ...options,
      ...(controller ? { signal: controller.signal } : {}),
    });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function resolveReachableApiBaseUrl() {
  if (apiBaseUrlVerified) return activeApiBaseUrl;
  if (API_BASE_URL_CANDIDATES.length <= 1) return activeApiBaseUrl;

  const orderedCandidates = [
    activeApiBaseUrl,
    ...API_BASE_URL_CANDIDATES.filter((candidate) => candidate !== activeApiBaseUrl),
  ];

  for (const candidate of orderedCandidates) {
    try {
      const response = await fetchWithTimeout(`${candidate}/health`, { method: "GET" }, API_HEALTH_TIMEOUT_MS);
      if (response.ok) {
        activeApiBaseUrl = candidate;
        apiBaseUrlVerified = true;
        return activeApiBaseUrl;
      }
    } catch (error) {
      if (!isNetworkError(error)) break;
    }
  }

  return activeApiBaseUrl;
}

export async function reverseGeocodeWithBigDataCloud(latitude, longitude, language = "it") {
  return apiRequest(
    `/geolocation/reverse?latitude=${encodeURIComponent(latitude)}` +
      `&longitude=${encodeURIComponent(longitude)}` +
      `&language=${encodeURIComponent(language)}`
  );
}

async function readApiJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function apiRequest(path, { method = "GET", token, body, timeoutMs = API_REQUEST_TIMEOUT_MS } = {}) {
  let response;
  const apiBaseUrl = await resolveReachableApiBaseUrl();

  try {
    response = await fetchWithTimeout(`${apiBaseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    }, timeoutMs);
  } catch (error) {
    if (isNetworkError(error)) {
      apiBaseUrlVerified = false;
      throw new Error("Backend non raggiungibile");
    }
    throw error;
  }

  const data = await readApiJson(response);
  if (!response.ok) {
    throw new Error(data?.message || `Errore backend ${response.status}`);
  }
  return data;
}
