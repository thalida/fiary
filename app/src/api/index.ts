import {
  useQuery as villusUseQuery,
  type QueryCompositeOptions,
  type QueryVariables,
} from "villus";
import merge from "lodash/merge";
import { useAuthStore } from "@/stores/auth";

export function useQuery<TData, TVars = QueryVariables>(opts: QueryCompositeOptions<TData, TVars>) {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;

  const context = {
    headers: null as Record<string, string> | null,
  };

  if (isAuthenticated && authStore.authToken !== null) {
    context.headers = {
      Authorization: `JWT ${authStore.authToken}`,
    };
  }

  return villusUseQuery(merge(opts, { context }));
}
