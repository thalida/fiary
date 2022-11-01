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
const registerForm = ref({
  username: "",
  password: "",
  email: "",
});
const currentUser = computed(() => usersStore.me);

authStore.autoLogin();

const callback: CallbackTypes.TokenResponseCallback = (response) => {
  authStore.loginWithGoogleOauth(response.access_token);
};

function handleLoginSubmit() {
  authStore.loginWithCreds(loginForm.value.username, loginForm.value.password);
  loginForm.value.password = "";
}

function handleRegisterSubmit() {
  authStore.register(registerForm.value);
  registerForm.value.password = "";
}
</script>

<template>
  <div v-if="!authStore.isAuthenticated">
    <GoogleLogin :callback="callback" popup-type="TOKEN">
      <button>Login Using Google</button>
    </GoogleLogin>
    <form @submit.prevent="handleLoginSubmit">
      <label>Username</label>
      <input type="string" v-model="loginForm.username" />
      <label>Password</label>
      <input type="password" v-model="loginForm.password" />
      <button type="submit">Login</button>
    </form>
    <hr />
    <form @submit.prevent="handleRegisterSubmit">
      <label>Username</label>
      <input type="string" v-model="registerForm.username" />
      <label>Email</label>
      <input type="string" v-model="registerForm.email" />
      <label>Password</label>
      <input type="password" v-model="registerForm.password" />
      <button type="submit">Register</button>
    </form>
  </div>
  <div v-else>
    <h1>Welcome {{ currentUser?.username }}</h1>
    <button @click="authStore.logout">Logout</button>
  </div>
  <RouterView />
</template>
