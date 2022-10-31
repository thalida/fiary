import { createApp } from "vue";
import { createPinia } from "pinia";
import { createClient } from "villus";
import vue3GoogleLogin from "vue3-google-login";

import App from "./App.vue";
import router from "./router";

import "quill/dist/quill.snow.css";
import "quill/dist/quill.bubble.css";
import "./styles/main.css";

const app = createApp(App);

const graphqlClient = createClient({
  url: "http://localhost:8000/graphql/", // your endpoint.
});

app.use(graphqlClient);
app.use(createPinia());
app.use(router);
app.use(vue3GoogleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
});

app.mount("#app");
