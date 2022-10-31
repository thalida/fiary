<script setup lang="ts">
import { ref } from "vue";
import { RouterView } from "vue-router";
import type { CallbackTypes } from "vue3-google-login";
import { useAuthStore } from "@/stores/auth";
import { useUsersStore } from "@/stores/users";

const authStore = useAuthStore();
const usersStore = useUsersStore();
const user = ref({
  username: "",
  password: "",
});

authStore.autoLogin();

const callback: CallbackTypes.TokenResponseCallback = async (response) => {
  await authStore.loginWithGoogleOauth(response.access_token);
  await usersStore.fetchMe();
};

const login = async (e: Event) => {
  e.preventDefault();
  await authStore.loginWithCreds(user.value.username, user.value.password);
  await usersStore.fetchMe();
};
</script>

<template>
  <div v-if="!authStore.isAuthenticated">
    <GoogleLogin :callback="callback" popup-type="TOKEN">
      <button>Login Using Google</button>
    </GoogleLogin>
    <form>
      <label>Username</label>
      <input type="string" v-model="user.username" />
      <label>Password</label>
      <input type="password" v-model="user.password" />
      <button @click="login">Login</button>
    </form>
  </div>
  <div v-else>
    <button @click="authStore.logout">Logout</button>
  </div>
  <RouterView />
</template>
