import { defineStore } from "pinia";
import { computed, ref } from "vue";
import merge from "lodash/merge";
import { useQuery, processGraphqlData, useMutation } from "@/api";
import {
  CreateNotebookDocument,
  MyRoomsDocument,
  MyNotebooksDocument,
  CreatePageDocument,
  MyPagesDocument,
} from "@/api/graphql-operations";
import type { IBookshelves, INotebooks, IPages, IRooms, TPrimaryKey } from "@/types/core";

export const useCoreStore = defineStore("core", () => {
  const rooms = ref({} as IRooms);
  const bookshelves = ref({} as IBookshelves);
  const notebooks = ref({} as INotebooks);
  const pages = ref({} as IPages);

  const myRoom = computed(() => {
    const roomKeys = Object.keys(rooms.value);
    if (roomKeys.length === 0) return;

    return rooms.value[roomKeys[0]];
  });

  const myBookshelf = computed(() => {
    if (typeof myRoom.value === "undefined") return;

    const bookshelfOrder = myRoom.value.bookshelfOrder;
    if (bookshelfOrder.length === 0) return;

    return bookshelves.value[bookshelfOrder[0]];
  });

  async function fetchMyRooms() {
    const { data } = await useQuery({
      query: MyRoomsDocument,
      cachePolicy: "network-only",
    });

    const res = processGraphqlData(data.value);
    for (let i = 0; i < res.myRooms.length; i += 1) {
      const { pk, bookshelfOrder, updatedAt, createdAt } = res.myRooms[i];
      rooms.value[pk] = { pk, bookshelfOrder, updatedAt, createdAt };
    }

    for (let i = 0; i < res.bookshelves.length; i += 1) {
      const { pk, notebookOrder, updatedAt, createdAt, room } = res.bookshelves[i];
      bookshelves.value[pk] = { pk, notebookOrder, updatedAt, createdAt, room: room.pk };
    }

    for (let i = 0; i < res.notebooks.length; i += 1) {
      const { pk, title, pageOrder, updatedAt, createdAt, bookshelf } = res.notebooks[i];
      notebooks.value[pk] = {
        pk,
        title,
        pageOrder,
        updatedAt,
        createdAt,
        bookshelf: bookshelf.pk,
      };
    }
  }

  async function fetchNotebook(pk: TPrimaryKey) {
    const { data } = await useQuery({
      query: MyNotebooksDocument,
      variables: { pk },
      cachePolicy: "network-only",
    });
    const res = processGraphqlData(data.value);

    if (
      typeof res.myNotebooks === "undefined" ||
      res.myNotebooks === null ||
      res.myNotebooks.length === 0
    ) {
      return;
    }

    const rawNotebook = res.myNotebooks[0];
    notebooks.value[pk] = merge(notebooks.value[pk], {
      pk: rawNotebook.pk,
      updatedAt: rawNotebook.updatedAt,
      createdAt: rawNotebook.createdAt,
      title: rawNotebook.title,
      pageOrder: rawNotebook.pageOrder,
      bookshelf: rawNotebook.bookshelf.pk,
    });

    for (let i = 0; i < res.pages.length; i += 1) {
      const { pk, updatedAt, createdAt, notebook } = res.pages[i];
      pages.value[pk] = { pk, updatedAt, createdAt, notebook: notebook.pk };
    }

    return notebooks.value[pk];
  }

  async function createNotebook(bookshelfPk: TPrimaryKey, title = "Untitled") {
    const { execute, data } = useMutation(CreateNotebookDocument);
    await execute({ bookshelfPk, title });

    const notebook = data.value.createNotebook?.notebook;
    if (typeof notebook === "undefined" || notebook === null) {
      throw new Error("Failed to create notebook");
    }

    notebooks.value[notebook.pk] = {
      pk: notebook.pk,
      title: notebook.title,
      pageOrder: notebook.pageOrder,
      updatedAt: notebook.updatedAt,
      createdAt: notebook.createdAt,
      bookshelf: notebook.bookshelf.pk,
    };

    bookshelves.value[notebook.bookshelf.pk] = merge(
      bookshelves.value[notebook.bookshelf.pk],
      notebook.bookshelf
    );

    return notebooks.value[notebook.pk];
  }

  async function fetchPage(pk: TPrimaryKey) {
    const { data } = await useQuery({
      query: MyPagesDocument,
      variables: { pk },
      cachePolicy: "network-only",
    });
    const res = processGraphqlData(data.value);

    if (typeof res.myPages === "undefined" || res.myPages === null || res.myPages.length === 0) {
      return;
    }

    const rawPage = res.myPages[0];
    pages.value[pk] = merge(pages.value[pk], {
      pk: rawPage.pk,
      updatedAt: rawPage.updatedAt,
      createdAt: rawPage.createdAt,
      notebook: rawPage.notebook.pk,
    });

    return pages.value[pk];
  }

  async function createPage(notebookPk: TPrimaryKey) {
    const { execute, data } = useMutation(CreatePageDocument);
    await execute({ notebookPk });

    const page = data.value.createPage?.page;
    if (typeof page === "undefined" || page === null) {
      throw new Error("Failed to create page");
    }

    pages.value[page.pk] = {
      pk: page.pk,
      updatedAt: page.updatedAt,
      createdAt: page.createdAt,
      notebook: page.notebook.pk,
    };

    notebooks.value[page.notebook.pk] = merge(notebooks.value[page.notebook.pk], page.notebook);

    return pages.value[page.pk];
  }

  return {
    rooms,
    bookshelves,
    notebooks,
    pages,
    myRoom,
    myBookshelf,

    fetchMyRooms,

    fetchNotebook,
    createNotebook,

    fetchPage,
    createPage,
  };
});
