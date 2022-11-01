import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useQuery } from "@/api";
import { MeDocument } from "@/api/graphql-operations";
import type { IUsers, IUser, TUserId } from "@/types/users";
import { useAuthStore } from "./auth";

export const useUsersStore = defineStore("users", () => {
  const authStore = useAuthStore();
  const currentUserId = ref(null as TUserId | null);
  const users = ref({} as IUsers);

  const me = computed(() => {
    return currentUserId.value ? users.value[currentUserId.value] : null;
  });

  authStore.$subscribe((mutation, state) => {
    if (state.isAuthenticated) {
      fetchMe();
    } else if (currentUserId.value !== null) {
      delete users.value[currentUserId.value];
      currentUserId.value = null;
    }
  });

  async function fetchMe() {
    const { data } = await useQuery({ query: MeDocument, cachePolicy: "network-only" });
    if (data.value?.me) {
      const user = data.value.me as IUser;
      currentUserId.value = user.id;
      users.value[user.id] = user;
    }
  }

  return {
    currentUserId,
    me,
    fetchMe,
  };
});
