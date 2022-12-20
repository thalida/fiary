import { createApp } from "vue";
import { createPinia } from "pinia";
import { createClient } from "villus";
import vue3GoogleLogin from "vue3-google-login";
import { MotionPlugin } from "@vueuse/motion";
import { GesturePlugin } from "@vueuse/gesture";

import App from "./App.vue";
import router from "./router";

import "quill/dist/quill.snow.css";
import "quill/dist/quill.bubble.css";
import "./styles/main.css";

const app = createApp(App);

const graphqlClient = createClient({
  url: import.meta.env.VITE_GRAPHQL_URL,
});

app.use(graphqlClient);
app.use(createPinia());
app.use(router);
app.use(vue3GoogleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
});
app.use(MotionPlugin);
app.use(GesturePlugin);

app.mount("#app");
