<script setup lang="ts">
import { ref } from "vue";
import type { CallbackTypes } from "vue3-google-login";
import { useAuthStore } from "@/stores/auth";
import router from "@/router";

const authStore = useAuthStore();
const loginForm = ref({
  username: "",
  password: "",
});
const registerForm = ref({
  username: "",
  password: "",
  email: "",
});

const callback: CallbackTypes.TokenResponseCallback = (response) => {
  authStore.loginWithGoogleOauth(response.access_token).then(handleResponse);
};

function handleLoginSubmit() {
  authStore.loginWithCreds(loginForm.value).then(handleResponse);
  loginForm.value.password = "";
}

function handleRegisterSubmit() {
  authStore.register(registerForm.value).then(handleResponse);
  registerForm.value.password = "";
}

function handleResponse() {
  if (authStore.isAuthenticated) {
    router.push({ name: "Home" });
  }
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
</template>

<style scoped></style>
