import { defineStore } from "pinia";
import { computed, ref } from "vue";
import axios from "axios";
import { useMutation } from "villus";
import {
  RegisterDocument,
  RegisterSocialDocument,
  TokenAuthDocument,
  VerifyTokenDocument,
} from "../api/graphql-operations";
import type { ILoginUser, IRegisterUser, TAuthToken } from "@/types/users";
import { useStorage } from "@vueuse/core";

export const useAuthStore = defineStore("auth", () => {
  const authToken = useStorage("fiary:authToken", null as TAuthToken | null | undefined);
  const isAuthenticated = ref(false);
  const isFetching = { verifyToken: ref(false) };

  const isReady = computed(() => {
    return !isFetching.verifyToken.value;
  });

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

  async function loginWithCreds(user: ILoginUser) {
    const { data, execute } = useMutation(TokenAuthDocument);
    await execute(user);
    authToken.value = data?.value.tokenAuth?.token;
    setIsAuthenticated();
  }

  async function registerWithCreds(user: IRegisterUser) {
    const { data, execute } = useMutation(RegisterDocument);
    await execute(user);
    authToken.value = data?.value.register?.token;
    setIsAuthenticated();
  }

  async function loginWithSocial({
    accessToken,
    socialBackend,
  }: {
    accessToken: string;
    socialBackend: string;
  }) {
    const { data, execute } = useMutation(RegisterSocialDocument);
    await execute({ accessToken, socialBackend });
    authToken.value = data?.value.registerSocial?.token;
    setIsAuthenticated();
  }

  function logout() {
    authToken.value = null;
    setIsAuthenticated();
  }

  return {
    isAuthenticated,
    isReady,
    isFetching,
    authToken,
    autoLogin,
    registerWithCreds,
    loginWithCreds,
    loginWithSocial,
    logout,
  };
});
