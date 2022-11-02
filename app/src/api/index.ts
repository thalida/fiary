import {
  useQuery as vUseQuery,
  useMutation as vUseMutation,
  type QueryCompositeOptions,
  type QueryVariables,
  type Operation,
  type QueryExecutionContext,
  type MaybeRef,
} from "villus";
import merge from "lodash/merge";
import { useAuthStore } from "@/stores/auth";

interface MutationExecutionOptions {
  context: MaybeRef<QueryExecutionContext>;
}

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

  return vUseQuery(merge(opts, { context }));
}

export function useMutation<TData, TVars = QueryVariables>(
  query: Operation<TData, TVars>["query"],
  opts?: MutationExecutionOptions
) {
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

  return vUseMutation(query, merge(opts, { context }));
}

export function processGraphqlData(data: any) {
  const { flattenedEdges } = flattenGraphqlData(data);
  return flattenedEdges;
}

function flattenGraphqlData(data: any) {
  const flattenedProps: { [key: string]: any } = {};
  let flattenedEdges: { [key: string]: { [key: string]: any } } = {};
  for (const [key, value] of Object.entries(data)) {
    const typedValue = value as any;

    if (
      typedValue !== null &&
      typeof typedValue === "object" &&
      typeof typedValue.edges !== "undefined"
    ) {
      flattenedEdges[key] = {};
      for (const edge of typedValue.edges) {
        const res = flattenGraphqlData(edge.node);
        flattenedEdges[key][edge.node.pk] = res.flattenedProps;
        flattenedEdges = merge(flattenedEdges, res.flattenedEdges);
      }
    } else {
      flattenedProps[key] = typedValue;
    }
  }

  return { flattenedProps, flattenedEdges };
}
