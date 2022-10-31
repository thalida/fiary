import { useQuery as villusUseQuery } from "villus";
import { useAuthStore } from "@/stores/auth";
import type { TypedDocumentNode as IDocumentNode } from "@graphql-typed-document-node/core";

export function useQuery<TData, TVars>(query: IDocumentNode<TData, TVars>) {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;

  let headers = {};

  if (isAuthenticated && authStore.authToken !== null) {
    headers = {
      Authorization: `JWT ${authStore.authToken}`,
    };
  }

  return villusUseQuery({
    query,
    context: {
      headers,
    },
  });
}
