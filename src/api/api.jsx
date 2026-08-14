import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { ENDPOINTS } from "./endpoints";

let _toast = null;
export const setToast = (toast) => {
  _toast = toast;
};
export const getToast = () => _toast;

let _authToken = null;
export const getAuthToken = () => _authToken;

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => _toast?.error("Request Failed", error.message)
  }),
  mutationCache: new MutationCache({
    onError: (error) => _toast?.error("Request Failed", error.message)
  }),
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 0,
      retry: 1,
      refetchOnWindowFocus: true
    },
    mutations: {
      retry: 0
    }
  }
});

export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://cademo.hacheckinasyst.com:20029/api/v1";

export const IMAGE_BASE_URL =
  import.meta.env.VITE_IMAGE_API_BASE_URL ??
  "https://cademo.hacheckinasyst.com:20029/image-api/api/v1";

export const AUTH_BASE_URL =
  import.meta.env.VITE_AUTH_BASE_URL ??
  "https://cademo.hacheckinasyst.com:20029/auth-api";

const AUTH_CREDENTIALS = {
  client_id: "e585044a-0d11-4df1-b789-18a9b52a2728",
  client_secret: "NwQlq0VsccSUWFHo2CQlgUrttTYgTH475pYiYGgJBzQ=",
  tenant_id: "Common"
};

export const COMMON_HEADERS = {
  TenantId: "Common",
  OrgId: "100",
  "X-Correlation-ID": "postman-test-001"
};

export const BROADCAST_CONFIG_HEADERS = {
  TenantId: "Common",
  OrgId: "100"
};

export async function fetchAuthToken() {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: AUTH_CREDENTIALS.client_id,
    client_secret: AUTH_CREDENTIALS.client_secret,
    tenant_id: AUTH_CREDENTIALS.tenant_id
  });
  const res = await fetch(`${AUTH_BASE_URL}${ENDPOINTS.auth.TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const json = await handleResponse(res);
  const raw = json?.AuthorizedAccessToken;
  return raw ? raw.replace(/^bearer\s+/i, "") : raw;
}

export async function introspectAuthToken(token) {
  const body = new URLSearchParams({
    token,
    client_id: AUTH_CREDENTIALS.client_id,
    client_secret: AUTH_CREDENTIALS.client_secret,
    tenant_id: AUTH_CREDENTIALS.tenant_id
  });
  const res = await fetch(`${AUTH_BASE_URL}${ENDPOINTS.auth.INTROSPECT}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const json = await handleResponse(res);
  return { active: json?.active === true, exp: json?.exp ?? null };
}

export async function initAuth() {
  const token = await fetchAuthToken();
  if (!token) throw new Error("Failed to obtain access token");
  const { active } = await introspectAuthToken(token);
  if (!active) throw new Error("Access token is not active");
  _authToken = token;
  COMMON_HEADERS.Appkey = token;
  BROADCAST_CONFIG_HEADERS.Appkey = token;
  return token;
}

export async function handleResponse(res) {
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const err = json?.error;
    const message =
      (typeof err === "object" ? err?.detail || err?.title : err) ||
      json?.message ||
      res.statusText ||
      "Request failed";
    throw new Error(message);
  }

  if (json && json.success === false) {
    const err = json.error;
    const message =
      (typeof err === "object" ? err?.detail || err?.title : err) ||
      json.message ||
      "Request failed";
    throw new Error(message);
  }

  return json;
}
