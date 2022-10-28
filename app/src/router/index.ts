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
      path: "/n/:notebookId",
      props: true,
      component: NotebookIndex,
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
        }
      ]
    },
  ],
});

export default router;
