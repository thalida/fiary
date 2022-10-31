import { defineStore } from "pinia";
import { computed, ref, type Ref } from "vue";
import axios from "axios";
import { useQuery } from "villus";
import { MeDocument } from "../api/graphql-operations";
import type { IUsers, IUser, TUserId } from "@/types/users";

export const useUsersStore = defineStore("users", () => {
  const users = ref({} as IUsers);
  const currentUserId = ref(null as TUserId | null);
  const isAuthenticated = computed(() => {
    return currentUserId.value !== null;
  });

  const me = computed(() => {
    return currentUserId.value ? users.value[currentUserId.value] : null;
  });

  async function registerByGoogleOauth(googleAccessToken: string) {
    const response = await axios.get(
      `http://localhost:8000/auth/register-by-token/google-oauth2/`,
      {
        params: {
          access_token: googleAccessToken,
        },
      }
    );

    const { data } = await useQuery({
      query: MeDocument,
      context: {
        headers: {
          Authorization: `JWT ${response.data.token}`,
        },
      },
    });

    if (data.value) {
      const user = data.value.me;

      if (user) {
        const newUser: IUser = {
          id: user.id,
          pk: user.pk,
          username: user.username,
          token: response.data.token,
        };
        currentUserId.value = newUser.id;
        users.value[newUser.id] = newUser;
      }
    }
  }

  return {
    isAuthenticated,
    currentUserId,
    me,
    registerByGoogleOauth,
  };
});
