import { useMutation } from "@tanstack/react-query";
import { BASE_URL, COMMON_HEADERS, handleResponse } from "../api/api.jsx";

export function useDelete(endpoint, options = {}) {
  return useMutation({
    mutationFn: async (body) => {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...COMMON_HEADERS },
        ...(body !== undefined && { body: JSON.stringify(body) })
      });
      return handleResponse(res);
    },
    ...options
  });
}
