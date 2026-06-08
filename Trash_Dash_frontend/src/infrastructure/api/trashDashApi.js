// Infrastructure layer: adapter HTTP/WebSocket verso backend TrashDash.
import { NativeModules } from "react-native";

const API_REQUEST_TIMEOUT_MS = 10000;

function getExpoHost() {
  const scriptURL = NativeModules?.SourceCode?.scriptURL || "";
  const match = scriptURL.match(/^(?:https?|exp):\/\/([^/:?#]+)/i);
  return match?.[1] || "";
}

const EXPO_HOST = getExpoHost();
export const API_BASE_URL = EXPO_HOST
  ? `http://${EXPO_HOST}:4000/api`
  : process.env.EXPO_PUBLIC_API_BASE_URL || "http://10.0.2.2:4000/api";
export const WS_URL = EXPO_HOST
  ? `ws://${EXPO_HOST}:4000/ws`
  : process.env.EXPO_PUBLIC_WS_URL || API_BASE_URL.replace(/^http/i, "ws").replace(/\/api\/?$/, "/ws");


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
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller && timeoutMs
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      ...(controller ? { signal: controller.signal } : {}),
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Backend non raggiungibile");
    }
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  const data = await readApiJson(response);
  if (!response.ok) {
    throw new Error(data?.message || `Errore backend ${response.status}`);
  }
  return data;
}
