import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";

let _toast = null;
export const setToast = (toast) => {
  _toast = toast;
};

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
  "https://cademo.hacheckinasyst.com:20029";

export const COMMON_HEADERS = {
  TenantId: "V827QA",
  OrganizationId: "600",
  "X-Correlation-ID": "postman-test-001"
};

export const BROADCAST_CONFIG_HEADERS = {
  TenantId: "Common",
  OrganizationId: "100"
};

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
