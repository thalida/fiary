import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";
import { useMutation } from "villus";
import { TokenAuthDocument, VerifyTokenDocument } from "../api/graphql-operations";
import type { TAuthToken } from "@/types/users";
import { useStorage } from "@vueuse/core";

export const useAuthStore = defineStore("auth", () => {
  const authToken = useStorage("fiary:authToken", null as TAuthToken | null | undefined);
  const isAuthenticated = ref(false);

  async function autoLogin() {
    if (authToken.value) {
      const { execute, data } = useMutation(VerifyTokenDocument);
      await execute({ token: authToken.value });

      if (data.value?.verifyToken?.payload) {
        isAuthenticated.value = true;
      } else {
        authToken.value = null;
        isAuthenticated.value = false;
      }
    }
  }

  async function loginWithCreds(username: string, password: string) {
    const { data, execute } = useMutation(TokenAuthDocument);
    await execute({ username, password });
    authToken.value = data?.value.tokenAuth?.token;
    isAuthenticated.value = typeof authToken.value !== "undefined" && authToken.value !== null;
  }

  async function loginWithGoogleOauth(googleAccessToken: string) {
    const response = await axios.get(
      `http://localhost:8000/auth/register-by-token/google-oauth2/`,
      {
        params: {
          access_token: googleAccessToken,
        },
      }
    );

    authToken.value = response.data.token;
    isAuthenticated.value = typeof authToken.value !== "undefined" && authToken.value !== null;
  }

  async function logout() {
    isAuthenticated.value = false;
    authToken.value = null;
  }

  return {
    isAuthenticated,
    authToken,
    autoLogin,
    loginWithCreds,
    loginWithGoogleOauth,
    logout,
  };
});
