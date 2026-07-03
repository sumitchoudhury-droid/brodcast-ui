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
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: 0
    }
  }
});

export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://cademo.hacheckinasyst.com:20056";

export async function handleResponse(res) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? "Request failed");
  }
  return res.json();
}
