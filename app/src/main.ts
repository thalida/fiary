import { createApp } from "vue";
import { createPinia } from "pinia";
import VueKonva from 'vue-konva';

import App from "./App.vue";
import router from "./router";

import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'
import "./styles/main.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(VueKonva);

app.mount("#app");
