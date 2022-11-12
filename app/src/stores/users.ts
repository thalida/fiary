import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useQuery } from "@/api";
import { MeDocument } from "@/api/graphql-operations";
import type { TPrimaryKey } from "@/types/core";
import type { IUsers, IUser } from "@/types/users";
import { useAuthStore } from "./auth";

export const useUsersStore = defineStore("users", () => {
  const authStore = useAuthStore();
  const currentUserUid = ref(null as TPrimaryKey | null);
  const users = ref({} as IUsers);

  const me = computed(() => {
    return currentUserUid.value ? users.value[currentUserUid.value] : null;
  });

  authStore.$subscribe((mutation, state) => {
    if (state.isAuthenticated) {
      fetchMe();
    } else if (currentUserUid.value !== null) {
      delete users.value[currentUserUid.value];
      currentUserUid.value = null;
    }
  });

  async function fetchMe() {
    const { data } = await useQuery({ query: MeDocument, cachePolicy: "network-only" });
    if (data.value?.me) {
      const user = data.value.me as IUser;
      currentUserUid.value = user.uid;
      users.value[user.uid] = user;
    }
  }

  return {
    currentUserUid,
    me,
    fetchMe,
  };
});
