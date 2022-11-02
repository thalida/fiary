import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useQuery, processGraphqlData, useMutation } from "@/api";
import { CreateNotebookDocument, MyRoomsDocument } from "@/api/graphql-operations";
import { merge } from "lodash";

export const useCoreStore = defineStore("core", () => {
  const rooms = ref(null as any | null);
  const bookshelves = ref(null as any | null);
  const notebooks = ref(null as any | null);
  const isFetching = {
    myRooms: ref(false),
  };

  const myRoom = computed(() => {
    if (rooms.value == null) return null;
    const roomKeys = Object.keys(rooms.value);
    if (roomKeys.length === 0) return null;

    return rooms.value[roomKeys[0]];
  });

  const myBookshelf = computed(() => {
    if (bookshelves.value === null || myRoom.value === null) return null;
    const bookshelfOrder = myRoom.value.bookshelfOrder;
    if (bookshelfOrder.length === 0) return null;

    return bookshelves.value[bookshelfOrder[0]];
  });

  async function fetchMyRooms() {
    const query = await useQuery({
      query: MyRoomsDocument,
      cachePolicy: "network-only",
    });

    isFetching.myRooms = query.isFetching;

    const res = processGraphqlData(query.data.value);
    rooms.value = res.myRooms;
    bookshelves.value = res.bookshelves;
    notebooks.value = res.notebooks;
  }

  async function createNotebook(title = "Untitled") {
    if (myBookshelf.value === null) return;

    const { execute, data } = useMutation(CreateNotebookDocument);
    await execute({ bookshelfId: myBookshelf.value.pk, title });

    const notebook = data.value.createNotebook?.notebook;
    if (typeof notebook === "undefined" || notebook === null) return;

    notebooks.value[notebook.pk] = notebook;
    bookshelves.value[notebook.bookshelf.pk] = merge(
      bookshelves.value[notebook.bookshelf.pk],
      notebook.bookshelf
    );
  }

  return {
    rooms,
    bookshelves,
    notebooks,
    myRoom,
    myBookshelf,
    isFetching,
    fetchMyRooms,
    createNotebook,
  };
});
