import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";
import { useMutation } from "villus";
import {
  RegisterDocument,
  TokenAuthDocument,
  VerifyTokenDocument,
} from "../api/graphql-operations";
import type { TAuthToken } from "@/types/users";
import { useStorage } from "@vueuse/core";

export const useAuthStore = defineStore("auth", () => {
  const authToken = useStorage("fiary:authToken", null as TAuthToken | null | undefined);
  const isAuthenticated = ref(false);
  const isFetching = { verifyToken: ref(false) };

  function setIsAuthenticated() {
    isAuthenticated.value = typeof authToken.value !== "undefined" && authToken.value !== null;
  }

  async function autoLogin() {
    if (authToken.value) {
      const mutation = useMutation(VerifyTokenDocument);
      isFetching.verifyToken = mutation.isFetching;

      await mutation.execute({ token: authToken.value });

      if (mutation.data.value?.verifyToken?.payload) {
        isAuthenticated.value = true;
      } else {
        authToken.value = null;
        isAuthenticated.value = false;
      }
    }
  }

  async function loginWithCreds(user: { username: string; password: string }) {
    const { data, execute } = useMutation(TokenAuthDocument);
    await execute(user);
    authToken.value = data?.value.tokenAuth?.token;
    setIsAuthenticated();
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
    setIsAuthenticated();
  }

  async function register(user: { username: string; email: string; password: string }) {
    const { data, execute } = useMutation(RegisterDocument);
    await execute(user);
    authToken.value = data?.value.register?.token;
    setIsAuthenticated();
  }

  function logout() {
    authToken.value = null;
    setIsAuthenticated();
  }

  return {
    isAuthenticated,
    isFetching,
    authToken,
    autoLogin,
    loginWithCreds,
    loginWithGoogleOauth,
    logout,
    register,
  };
});
