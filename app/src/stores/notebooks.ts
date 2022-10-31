import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { v4 as uuidv4 } from "uuid";

export type TNotebookId = string;
export interface INotebooks {
  [id: TNotebookId]: INotebook;
}
export interface INotebook {
  id: TNotebookId;
  title: string;
  pages: TNotebookPageId[];
}
export interface INotebookCreate {
  title: string;
}

export type TNotebookPageId = string;
export interface INotebookPages {
  [id: TNotebookPageId]: INotebookPage;
}
export interface INotebookPage {
  id: TNotebookPageId;
  notebookId: TNotebookId;
}
export interface INotebookPageCreate {
  notebookId: TNotebookId;
}

export const useNotebooksStore = defineStore("notebooks", () => {
  const notebooks = ref({} as INotebooks);
  const notebookOrder = ref([] as TNotebookId[]);
  const pages = ref({} as INotebookPages);

  const orderedNotebooks = computed(() => {
    return notebookOrder.value.map((id) => notebooks.value[id]);
  });

  const numNotebooks = computed(() => {
    return notebookOrder.value.length;
  });

  const getNotebookById = computed(() => {
    return (id: TNotebookId) => {
      return notebooks.value[id];
    };
  });

  const numNotebookPages = computed(() => {
    return (id: TNotebookId) => {
      return notebooks.value[id].pages.length;
    };
  });

  const orderedNotebookPages = computed(() => {
    return (id: TNotebookId) => {
      return notebooks.value[id].pages.map((pageId) => pages.value[pageId]);
    };
  });

  const getNotebookPageById = computed(() => {
    return (notebookId: TNotebookId, pageId: TNotebookPageId) => {
      const hasNotebook =
        typeof notebooks.value[notebookId] !== "undefined" &&
        notebooks.value[notebookId] !== null;
      if (hasNotebook && notebooks.value[notebookId].pages.includes(pageId)) {
        return pages.value[pageId];
      }
    };
  });

  async function fetchNotebooks() { }

  async function fetchNotebook(notebookId: TNotebookId) {
    fetchNotebookPages(notebookId);
  }

  async function fetchNotebookPages(notebookId: TNotebookId) { }

  async function fetchNotebookPage(
    notebookId: TNotebookId,
    pageId: TNotebookPageId
  ) { }

  function createNotebook(notebook: INotebookCreate) {
    const id = uuidv4();
    notebookOrder.value.push(id);
    notebooks.value[id] = {
      id,
      pages: [],
      ...notebook,
    };

    createPage({ notebookId: id });

    return notebooks.value[id];
  }

  function createPage(page: INotebookPageCreate) {
    const id = uuidv4();
    pages.value[id] = {
      id,
      ...page,
    };
    notebooks.value[page.notebookId].pages.push(id);

    return pages.value[id];
  }

  return {
    numNotebooks,
    orderedNotebooks,
    getNotebookById,

    numNotebookPages,
    orderedNotebookPages,
    getNotebookPageById,

    fetchNotebooks,
    fetchNotebook,
    fetchNotebookPages,
    fetchNotebookPage,

    createNotebook,
    createPage,
  };
});
