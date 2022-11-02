import { defineStore } from "pinia";
import { computed, ref } from "vue";
import merge from "lodash/merge";
import { useQuery, processGraphqlData, useMutation } from "@/api";
import {
  CreateNotebookDocument,
  MyRoomsDocument,
  MyNotebooksDocument,
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
      const { pk, id, bookshelfOrder, updatedAt, createdAt } = res.myRooms[i];
      rooms.value[pk] = { pk, id, bookshelfOrder, updatedAt, createdAt };
    }

    for (let i = 0; i < res.bookshelves.length; i += 1) {
      const { pk, id, notebookOrder, updatedAt, createdAt, room } = res.bookshelves[i];
      bookshelves.value[pk] = { pk, id, notebookOrder, updatedAt, createdAt, room: room.pk };
    }

    for (let i = 0; i < res.notebooks.length; i += 1) {
      const { pk, id, title, pageOrder, updatedAt, createdAt, bookshelf } = res.notebooks[i];
      notebooks.value[pk] = {
        pk,
        id,
        title,
        pageOrder,
        updatedAt,
        createdAt,
        bookshelf: bookshelf.pk,
      };
    }
  }

  async function fetchNotebook(id: TPrimaryKey) {
    const { data } = await useQuery({
      query: MyNotebooksDocument,
      variables: { id },
      cachePolicy: "network-only",
    });
    const res = processGraphqlData(data.value);
    const rawNotebook = res.myNotebooks[0];
    notebooks.value[id] = merge(notebooks.value[id], {
      pk: rawNotebook.pk,
      id: rawNotebook.id,
      updatedAt: rawNotebook.updatedAt,
      createdAt: rawNotebook.createdAt,
      title: rawNotebook.title,
      pageOrder: rawNotebook.pageOrder,
      bookshelf: rawNotebook.bookshelf.pk,
    });

    for (let i = 0; i < res.pages.length; i += 1) {
      const { pk, id, updatedAt, createdAt, notebook } = res.pages[i];
      pages.value[pk] = { pk, id, updatedAt, createdAt, notebook: notebook.pk };
    }

    return notebooks.value[id];
  }

  async function createNotebook(title = "Untitled") {
    if (typeof myBookshelf.value === "undefined" || myBookshelf.value === null) return;

    const { execute, data } = useMutation(CreateNotebookDocument);
    await execute({ bookshelfId: myBookshelf.value.pk, title });

    const notebook = data.value.createNotebook?.notebook;
    if (typeof notebook === "undefined" || notebook === null) {
      throw new Error("Failed to create notebook");
    }

    notebooks.value[notebook.pk] = {
      pk: notebook.pk,
      id: notebook.id,
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
  };
});
