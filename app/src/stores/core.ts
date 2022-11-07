import { defineStore } from "pinia";
import { computed, ref } from "vue";
import merge from "lodash/merge";
import { v4 as uuidv4 } from "uuid";
import { useQuery, processGraphqlData, useMutation } from "@/api";
import {
  CreateNotebookDocument,
  MyRoomsDocument,
  MyNotebooksDocument,
  CreatePageDocument,
  MyPagesDocument,
  MyPalettesDocument,
} from "@/api/graphql-operations";
import type {
  IBookshelves,
  INotebooks,
  IPage,
  IPages,
  IRooms,
  TColor,
  TPrimaryKey,
} from "@/types/core";
import {
  DEFAULT_COLOR_SWATCHES,
  DEFAULT_ELEMENT_FILLCOLOR_INDEX,
  DEFAULT_ELEMENT_STROKECOLOR_INDEX,
  DEFAULT_PAPER_COLOR_INDEX,
  DEFAULT_PATTERN_COLOR_INDEX,
  DEFAULT_PATTERN_OPACITY,
  DEFAULT_PATTERN_TYPE,
  DEFAULT_SWATCH_KEY,
  MAX_SWATCH_COLORS,
  SPECIAL_PAPER_SWATCH_KEY,
  SPECIAL_TOOL_SWATCH_KEY,
} from "@/constants/core";
import { randomInteger } from "@/utils/math";

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

  const swatches = ref(DEFAULT_COLOR_SWATCHES);
  const swatchOrder = ref([DEFAULT_SWATCH_KEY]);
  const getSwatchColor = computed(() => (key: string, idx: number) => swatches.value[key][idx]);

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

  async function fetchMyPalettes() {
    const { data } = await useQuery({
      query: MyPalettesDocument,
      cachePolicy: "network-only",
    });

    console.log(data.value);

    // const res = processGraphqlData(data.value);
    // for (let i = 0; i < res.myRooms.length; i += 1) {
    //   const { pk, bookshelfOrder, updatedAt, createdAt } = res.myRooms[i];
    //   rooms.value[pk] = { pk, bookshelfOrder, updatedAt, createdAt };
    // }

    // for (let i = 0; i < res.bookshelves.length; i += 1) {
    //   const { pk, notebookOrder, updatedAt, createdAt, room } = res.bookshelves[i];
    //   bookshelves.value[pk] = { pk, notebookOrder, updatedAt, createdAt, room: room.pk };
    // }

    // for (let i = 0; i < res.notebooks.length; i += 1) {
    //   const { pk, title, pageOrder, updatedAt, createdAt, bookshelf } = res.notebooks[i];
    //   notebooks.value[pk] = {
    //     pk,
    //     title,
    //     pageOrder,
    //     updatedAt,
    //     createdAt,
    //     bookshelf: bookshelf.pk,
    //   };
    // }
  }

  function createSwatch() {
    const swatchId = uuidv4();
    const colors = [];

    for (let i = 0; i < MAX_SWATCH_COLORS; i += 1) {
      const color = {
        r: randomInteger(0, 255),
        g: randomInteger(0, 255),
        b: randomInteger(0, 255),
        a: 1,
      };
      colors.push(color);
    }
    swatches.value[swatchId] = colors;
    swatchOrder.value.push(swatchId);
  }

  function updateSwatchColor(swatchId: string, colorIdx: number, color: TColor) {
    swatches.value[swatchId][colorIdx] = color;
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
      pages.value[pk] = { pk, updatedAt, createdAt, notebook: notebook.pk } as IPage;
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

  function storePage(page: any) {
    const currPage = pages.value[page.pk];
    const formattedPage: Partial<IPage> = {
      pk: page.pk,
      updatedAt: page.updatedAt,
      createdAt: page.createdAt,
      notebook: page.notebook.pk,
      paperColor: page.paperColor
        ? JSON.parse(page.paperColor as unknown as string)
        : getSwatchColor.value(SPECIAL_PAPER_SWATCH_KEY, DEFAULT_PAPER_COLOR_INDEX),
      patternType: page.patternType ? page.patternType : DEFAULT_PATTERN_TYPE,
      patternColor: page.patternColor
        ? JSON.parse(page.patternColor as unknown as string)
        : getSwatchColor.value(SPECIAL_PAPER_SWATCH_KEY, DEFAULT_PATTERN_COLOR_INDEX),
      patternSize: typeof page.patternSize !== "undefined" ? page.patternSize : null,
      patternSpacing: typeof page.patternSpacing !== "undefined" ? page.patternSpacing : null,
      patternOpacity: page.patternOpacity ? page.patternOpacity : DEFAULT_PATTERN_OPACITY,
    };

    pages.value[page.pk] = merge(currPage, formattedPage);

    const updatedPage = pages.value[page.pk];
    if (typeof updatedPage.fillColor === "undefined" || updatedPage.fillColor === null) {
      const fillColor = getSwatchColor.value(DEFAULT_SWATCH_KEY, DEFAULT_ELEMENT_FILLCOLOR_INDEX);
      pages.value[page.pk].fillColor = fillColor;
    }

    if (typeof updatedPage.strokeColor === "undefined" || updatedPage.strokeColor === null) {
      const strokeColor = getSwatchColor.value(
        SPECIAL_TOOL_SWATCH_KEY,
        DEFAULT_ELEMENT_STROKECOLOR_INDEX
      );
      pages.value[page.pk].strokeColor = strokeColor;
    }

    notebooks.value[page.notebook.pk] = merge(notebooks.value[page.notebook.pk], page.notebook);

    return pages.value[page.pk];
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

    const page = res.myPages[0];
    return storePage(page);
  }

  async function createPage(notebookPk: TPrimaryKey) {
    const { execute, data } = useMutation(CreatePageDocument);
    const paperColor = JSON.stringify(
      getSwatchColor.value(SPECIAL_PAPER_SWATCH_KEY, DEFAULT_PAPER_COLOR_INDEX)
    );

    await execute({ notebookPk, paperColor });

    const page = data.value.createPage?.page;
    if (typeof page === "undefined" || page === null) {
      throw new Error("Failed to create page");
    }

    return storePage(page);
  }

  return {
    rooms,
    myRoom,
    fetchMyRooms,

    bookshelves,
    myBookshelf,

    swatches,
    swatchOrder,
    fetchMyPalettes,
    createSwatch,
    updateSwatchColor,
    getSwatchColor,

    notebooks,
    fetchNotebook,
    createNotebook,

    pages,
    fetchPage,
    createPage,
  };
});
