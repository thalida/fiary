<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterView } from "vue-router";
import type { CallbackTypes } from "vue3-google-login";
import { useAuthStore } from "@/stores/auth";
import { useUsersStore } from "@/stores/users";

const authStore = useAuthStore();
const usersStore = useUsersStore();
const loginForm = ref({
  username: "",
  password: "",
});
const currentUser = computed(() => usersStore.me);

authStore.autoLogin();

const callback: CallbackTypes.TokenResponseCallback = (response) => {
  authStore.loginWithGoogleOauth(response.access_token);
};

function login(e: Event) {
  e.preventDefault();
  authStore.loginWithCreds(loginForm.value.username, loginForm.value.password);
  loginForm.value.password = "";
}
</script>

<template>
  <div v-if="!authStore.isAuthenticated">
    <GoogleLogin :callback="callback" popup-type="TOKEN">
      <button>Login Using Google</button>
    </GoogleLogin>
    <form>
      <label>Username</label>
      <input type="string" v-model="loginForm.username" />
      <label>Password</label>
      <input type="password" v-model="loginForm.password" />
      <button @click="login">Login</button>
    </form>
  </div>
  <div v-else>
    <h1>Welcome {{ currentUser?.username }}</h1>
    <button @click="authStore.logout">Logout</button>
  </div>
  <RouterView />
</template>
