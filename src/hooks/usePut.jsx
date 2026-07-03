import { useMutation } from "@tanstack/react-query";
import { BASE_URL, handleResponse } from "../api/api.jsx";

export function usePut(endpoint, options = {}) {
  return useMutation({
    mutationFn: async (body) => {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      return handleResponse(res);
    },
    ...options
  });
}
