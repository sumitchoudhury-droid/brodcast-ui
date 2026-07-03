import { useQuery } from "@tanstack/react-query";
import { BASE_URL, handleResponse } from "../api/api.jsx";

export function useGet(queryKey, endpoint, params, options = {}) {
  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      const url = new URL(`${BASE_URL}${endpoint}`, window.location.origin);
      if (params) {
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      }
      const res = await fetch(url.toString(), {
        headers: { "Content-Type": "application/json" }
      });
      return handleResponse(res);
    },
    ...options
  });
}
