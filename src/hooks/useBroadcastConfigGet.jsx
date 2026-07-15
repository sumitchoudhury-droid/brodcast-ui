import { useGet } from "./useGet";

export function useBroadcastConfigGet(
  queryKey,
  endpoint,
  params,
  options = {}
) {
  return useGet(queryKey, endpoint, params, {
    refetchOnWindowFocus: false,
    ...options
  });
}
