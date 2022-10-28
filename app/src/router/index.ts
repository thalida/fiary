import { createRouter, createWebHistory } from "vue-router";
import BookshelfIndex from "../views/Bookshelf/Index.vue";
import NotebookIndex from "../views/Notebook/Index.vue";
import NotebookOverview from "../views/Notebook/Overview.vue";
import NotebookPage from "../views/Notebook/Page.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "Bookshelf",
      component: BookshelfIndex,
    },
    {
      path: "/n/:id",
      component: NotebookIndex,
      children: [
        {
          path: "",
          name: "NotebookOverview",
          component: NotebookOverview,
        },
        {
          path: "p/:page-id",
          name: "NotebookPage",
          component: NotebookPage,
        }
      ]
    },
  ],
});

export default router;
