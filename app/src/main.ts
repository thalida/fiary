import { createApp } from "vue";
import { createPinia } from "pinia";
import vue3GoogleLogin from "vue3-google-login";
import { useClient } from "villus";

import App from "./App.vue";
import router from "./router";

import "quill/dist/quill.snow.css";
import "quill/dist/quill.bubble.css";
import "./styles/main.css";

const app = createApp(App);

// useClient({
//   url: "http://localhost:8000/graphql",
// });

app.use(createPinia());
app.use(router);
app.use(vue3GoogleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
});

app.mount("#app");
