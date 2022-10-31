<script setup lang="ts">
import { RouterView } from "vue-router";
import type { CallbackTypes } from "vue3-google-login";
import { useUsersStore } from "@/stores/users";

const usersStore = useUsersStore();

const callback: CallbackTypes.TokenResponseCallback = async (response) => {
  await usersStore.registerByGoogleOauth(response.access_token);
  console.log(usersStore.isAuthenticated, usersStore.me);
};
</script>

<template>
  <GoogleLogin :callback="callback" popup-type="TOKEN" v-if="!usersStore.isAuthenticated">
    <button>Login Using Google</button>
  </GoogleLogin>
  <RouterView />
</template>
