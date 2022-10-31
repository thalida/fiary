import { useQuery as villusUseQuery } from "villus";
import { useUsersStore } from "@/stores/users";

export function useQuery(query) {
  const store = useUsersStore();
  const isAuthenticated = store.isAuthenticated;

  let headers = {};

  if (isAuthenticated) {
    headers = {
      Authorization: `JWT ${store.me?.token}`,
    };
  }

  return villusUseQuery({
    query,
    context: {
      headers,
    },
  });
}
