import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useQuery } from "@/api";
import { MeDocument } from "@/api/graphql-operations";
import type { IUsers, IUser, TUserId } from "@/types/users";

export const useUsersStore = defineStore("users", () => {
  const currentUserId = ref(null as TUserId | null);
  const users = ref({} as IUsers);

  const me = computed(() => {
    return currentUserId.value ? users.value[currentUserId.value] : null;
  });

  async function fetchMe() {
    const { data } = await useQuery(MeDocument);
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
