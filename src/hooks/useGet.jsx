import { useQuery } from "@tanstack/react-query";
import { BASE_URL, COMMON_HEADERS, handleResponse } from "../api/api.jsx";

export function useGet(queryKey, endpoint, params, options = {}) {
  const { headers: customHeaders, ...queryOptions } = options;
  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      const url = new URL(`${BASE_URL}${endpoint}`, window.location.origin);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (Array.isArray(v)) {
            v.forEach((val) => url.searchParams.append(k, val));
          } else {
            url.searchParams.set(k, v);
          }
        });
      }
      const res = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          ...COMMON_HEADERS,
          ...customHeaders
        }
      });
      return handleResponse(res);
    },
    ...queryOptions
  });
}
