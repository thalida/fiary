import { createRouter, createWebHistory } from "vue-router";
import Signin from "@/views/SigninView.vue";
import Signout from "@/views/SignoutView.vue";
import Signup from "@/views/SignupView.vue";
import Bookshelf from "@/views/BookshelfView.vue";
import Notebook from "@/views/NotebookView.vue";
import Page from "@/views/PageView.vue";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/signin",
      name: "Signin",
      component: Signin,
      alias: "/login",
    },
    {
      path: "/signup",
      name: "Signup",
      component: Signup,
      alias: "/register",
    },
    {
      path: "/signout",
      name: "Signout",
      component: Signout,
      alias: "/logout",
    },
    {
      path: "/",
      name: "Home",
      component: Bookshelf,
      alias: "/bookshelf",
    },
    {
      path: "/n/:notebookId",
      props: true,
      name: "Notebook",
      component: Notebook,
    },
    {
      path: "/p/:pageId",
      props: true,
      name: "Page",
      component: Page,
    },
  ],
});

router.beforeEach(async (to) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (!requiresAuth) {
    return true;
  }

  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;

  if (isAuthenticated) {
    return true;
  }

  return {
    name: "Login",
    query: { redirect: to.fullPath },
  };
});

export default router;
