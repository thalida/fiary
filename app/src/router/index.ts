import { createRouter, createWebHistory } from "vue-router";
import RouterViewOnly from "@/layouts/RouterViewOnly.vue";
import Signin from "@/views/SigninPage.vue";
import Signout from "@/views/SignoutPage.vue";
import Signup from "@/views/SignupPage.vue";
import Bookshelf from "@/views/BookshelfPage.vue";
import NotebookOverview from "@/views/NotebookOverview.vue";
import NotebookPage from "@/views/NotebookPage.vue";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "Home",
      component: Bookshelf,
      alias: "/bookshelf",
    },
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
      path: "/n/:notebookId",
      props: true,
      component: RouterViewOnly,
      children: [
        {
          path: "",
          props: true,
          name: "Notebook",
          component: NotebookOverview,
        },
        {
          path: "p/:pageId",
          props: true,
          name: "NotebookPage",
          component: NotebookPage,
        },
      ],
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
