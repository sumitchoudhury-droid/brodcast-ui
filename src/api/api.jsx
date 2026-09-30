import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { ENDPOINTS } from "./endpoints";

let _activeToastCount = 0;
const TOAST_DURATION_MS = 5000;
const TOAST_EXIT_MS = 300;

let _toast = null;
export const setToast = (toast) => {
  const wrap = (type) => (title, message, duration) => {
    if (_activeToastCount > 0) return;
    _activeToastCount += 1;
    toast?.[type]?.(title, message, duration);
    setTimeout(
      () => {
        _activeToastCount = 0;
      },
      (duration ?? TOAST_DURATION_MS) + TOAST_EXIT_MS
    );
  };
  _toast = {
    success: wrap("success"),
    error: wrap("error"),
    warning: wrap("warning")
  };
};
export const getToast = () => _toast;

let _authToken = null;
export const getAuthToken = () => _authToken;

const GENERIC_ERROR_MESSAGE =
  "An unexpected error occurred. Please try again later or contact support if the issue persists.";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: () => _toast?.error("Request Failed", GENERIC_ERROR_MESSAGE)
  }),
  mutationCache: new MutationCache({
    onError: () => _toast?.error("Request Failed", GENERIC_ERROR_MESSAGE)
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

const IMAGE_APP_KEY =
  "8FfsSluu3xzOTpWpaqUQtySpnNnW5Ezf8lv9UBcHi/menW6KIYyj34wY8GKyoHPigFNr2yZ3lhdmwdku89/s1Hebe2sXVwBX33tUdb8Z2rK7tamMdA2+385F5zNgvd1RT329pBIBIIv/sno1TxKF2nGp8sSYQVhJ825Rl4pYwKIAzmiWu5/q2WUTfXGR4pguH8ttImUVqjHpYy8kH97jKxxrjBMvD20NzBkRUoKTOTaLpxox8KeIEURfogclSrhp7BYcKp0g8h66NHyke84nlWLMfJpRJnzSh1gTpK+5WjvKrKJlICSLnwtX4n3edOGLlM3SRivUpKVS/z9d/S8uH1DzogiKL1kDno+h4it5bBeZVZuU6wka45w2NrZmBtgP0Y2aK+dDFvgl+9icvZqMfCcSdL7eVAtvcZjvvImTUW3TWMHzBH+6zR4LJN1GJCJkwulZdNh1oJTGgpeCCQPOSxnII5vEp0jU1O6BgRj7BcgBgd14H7bzrQPS3k9mgfEM6N/em/fSDDjDgDaIZD/BSGYGFbSIb9cnXLaqlb4XM8Vl4hfpNNIlo+pYc3FbgfVgb6FgMCI/POCPg5EMVWdBYnrn6MHJx9tKL58PdW+UHGEypFOIh13nkV5eRttFTf2X3tal1iOpnbRUR9xYWaZ6OJDS49lRlPltgG1BlNNhK1ZVxMNdp2+ds5/WpfDoxaJ8LaLFOTB8SlauyvSnUUd0JPebXBQFkNp9ohpaLPj/O0Xp6xQcqZU45gvMpKdXuw5k0HIT88lNueH1zUblMs6V9PL5ImuLh+g1mXWIG7DueZIOajCvehs2ALTjF5sPsKT510PwqoNcIiW85/i4vPI0fDRsW0AXcfNkrLpq5zyZDEaJvo5plHETFU9hwRV4nFdE6Lus5tLnl91nT3S9ofIAjjwgrhS1F4If/dml4qjqEB3v7MnxDfiw/sKPGbvsCgTfU8wjP51zGSyPhUMKL+7HgKrYp1/7ehzJJW+k9vjljQ63N28Fd8TG/SGWdre8yRtfzMvHYsh/lX5PN5pq872l66dBpjq0jnX0IGsdZaEyGQP93saHfMUbUhlwgWDb/muSllDV42KCff44FgzG65jbJ+2ykN2GjDlEC5QoxF+zCTs1kymUDa9xkBduSJ9kc0xcnczGZv21RbxqM1fd+Pqa//vQo/kd/zCJUEGwcNPc4A6/xXbHX8gAafTLl1M/XnxHIcF0SSEZw1Ah612E2hC7KP7hB2f4xQaYAJl+k5qtWGoZ5akEx98p09FWIR/iI8sD7TNH7eXEu3dtbsi5J2IbtWWPw1gjeJEup6ciPbFNFS4rlaZ2LmAscHu4CCGLRFUkYiRVCJzDuWqrD6CoU8iPGFnw9kQhbMsszwkb+EduDNvdcvb55J45G6xOi7DNIPpXgIcIdJYpamfGCpgN+1gETXK/Fwpkqyeb9Q9AkJRtOyUW2NS8+KcfuXkdj3ovMOIHMxsRSPf5e1O7mlIiDoIohB5Kn41ktc0z0urrr9yoIU2SViRUqRX3vfhkntEZ+CnmZCK9ZQCR7nW8FFLLZ3H6Qf3Qo1iofStrPfnaakJs2d8D8whLzyFrVtkLDsaLefkpEhot3PPbZS33soaEZ8cOJ0xO/IM/4KmjZXAMkX5aA7ebJL0Ym8prpzsH4oYuNQQ2ZoYqxnLTivOTjx65wbhVb4aV3gsIRQh+sNZaZKQtpFGGd+1M0xv7Yy8Gw7bvBbSSlrOWEYA/xZ0MDpsXkf9a78pNjY+NQurJ8lzXDd4M8kS3cwr4q59t6BWDD/k9hgc21fdiofQOPpnO+EYPDgGrYvaScySEB+hRAvDXGWIyESYD4myCUfgk76Py3C8mpjaiEo+Oib6Q91UeGmZ4uZMhX91QR3xH9STKztYkKpa8YP7G79nYe/dw9lP9HFf6iZwiLuNRgddKiFuvXgATpU/91m90YMrkov0QRwrwnggOX/EZ2FYA0Z+BWjBYOdtibkzY+m/P0SliVQMa9RFFz85dHRS4VKDlaT5W9JqU0JckdkPoG9NBpORsIlasEB+vmx4xy3b9BLjvHs7+ui5i4HZTJoiG8aAuv1YATkZ1hIEIdeR9iWSHzXXK4iFz7pj/pkM0zq5v0oruXiB7pPpjmNKfc8J9D70Ks0STm48lmWrwli1Fbyv5cGo4Wgp2LFmZ5933JsIR7tXGiyn1Zrvx2O+x62CnQ/+H0gjiSh0QBm9WKuWGFV7MrYp98Icj5O7JcfpBDBXBBKWagnFHUvfdSQvfiHtHut79MqJmKY+b68xIerFUMM1i2LLO/InohpdYmcOSxCuwikJH7w5cMPZDKAUnCDKTZWug0iXKW7bBgxcPDs52QmJ0/b8U7ZkVGwcdzOiu9ZdEvAJrTCCWrVBYwxL2Y7u6cb0LI21I173dtvTnp1pvfXMP7jZgtCt79HIPmdASx62ttD4mQWx17e/pemvtK53FMxCPKqlaPf0kObXkTD6lgYpmRtYA6Nm2fAoEHsLU7lwv6L/N5w2MitFLwCzGoCg70zgrct+/mXFf/44WrRU2fMcFRhPKHxqBTibwFb1gHcyMrxiLLvqclY6pKcWD/L1r06fmyVMdyRzQYXbqNgyYAT/nho7lI9HWJC7/iXJZLfGGQCZVchrBAuhHeJaT0XOVpIWA2Dt13UsUq7WJC3jwn3wxO/lhh6LgWO6XZteMIN/vb06nCNmTQrktfPPraRaj0yY2SH+vXO+fr6ZqHU57HFjPJb7k4mmx7qwcgzKgTE/QEd4Xc/SLQVVHrZqgOpaz6W2NmBQBLUCYcNBZfTf7jpXjo7KY0sWSZjdq+mijA4+gXENoOZzLnZeidEl2C1Ljb/QDUwap8LnhtL4pkLAhwQiuMi5dXlrbpsVI5DpKD6HI/2DvDjrxJYUsow6OBmWd4Y8SoTxXexeH0GuN0t+JHhd2XgD6D6uWCusSn83Zyy77VKQJDs5qdtW0i78dDg==";

export const IMAGE_HEADERS = {
  TenantId: "Common",
  OrgId: "100",
  AppKey: IMAGE_APP_KEY
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
