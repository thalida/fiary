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
  MyPalettesDocument,
  UpdatePaletteSwatchDocument,
  CreatePaletteDocument,
  UpdatePageDocument,
  CreateElementDocument,
  MyElementsDocument,
} from "@/api/graphql-operations";
import type {
  IBookshelves,
  IElement,
  IElements,
  INotebooks,
  IPage,
  IPages,
  IPalette,
  IPalettes,
  IPaletteSwatch,
  IRooms,
  TColor,
  TPrimaryKey,
} from "@/types/core";
import {
  DEFAULT_PATTERN_OPACITY,
  DEFAULT_PATTERN_TYPE,
  MAX_SWATCH_COLORS,
  PALETTE_TYPES,
  TRANSPARENT_COLOR,
} from "@/constants/core";

export const useCoreStore = defineStore("core", () => {
  const rooms = ref({} as IRooms);
  const bookshelves = ref({} as IBookshelves);
  const notebooks = ref({} as INotebooks);
  const pages = ref({} as IPages);
  const elements = ref({} as IElements);

  const paletteCollections = ref({} as { [key: TPrimaryKey]: TPrimaryKey[] });
  const palettes = ref({} as IPalettes);
  const builtinPalettes = ref(
    {} as { [key in PALETTE_TYPES]: { palette: TPrimaryKey; swatch: TPrimaryKey } }
  );
  const defaultPaletteCollection = computed(() => {
    const keys = Object.keys(paletteCollections.value);
    if (keys.length === 0) {
      return null;
    }

    return paletteCollections.value[keys[0]];
  });
  const getSwatchColor = computed(
    () => (paletteUid: TPrimaryKey | null, swatchUid: TPrimaryKey | null) => {
      if (paletteUid === null || swatchUid === null) {
        return TRANSPARENT_COLOR;
      }

      const palette = palettes.value[paletteUid];
      const swatch = palette.swatches[swatchUid];
      return swatch.swatch;
    }
  );

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
      const { uid, bookshelfOrder, updatedAt, createdAt } = res.myRooms[i];
      rooms.value[uid] = { uid, bookshelfOrder, updatedAt, createdAt };
    }

    for (let i = 0; i < res.bookshelves.length; i += 1) {
      const { uid, notebookOrder, updatedAt, createdAt, room } = res.bookshelves[i];
      bookshelves.value[uid] = { uid, notebookOrder, updatedAt, createdAt, roomUid: room.uid };
    }

    for (let i = 0; i < res.notebooks.length; i += 1) {
      const { uid, title, pageOrder, updatedAt, createdAt, bookshelf } = res.notebooks[i];
      notebooks.value[uid] = {
        uid,
        title,
        pageOrder,
        updatedAt,
        createdAt,
        bookshelfUid: bookshelf.uid,
      };
    }
  }

  function storePalettes(res: any[]) {
    for (let i = 0; i < res.length; i += 1) {
      const paletteRes = res[i];
      const palette: IPalette = {
        uid: paletteRes.uid,
        updatedAt: paletteRes.updatedAt,
        createdAt: paletteRes.createdAt,
        title: paletteRes.title,
        paletteType: paletteRes.paletteType,
        isPublic: paletteRes.isPublic,
        swatches: {},
        swatchOrder: [],
      };
      let defaultSwatch: TPrimaryKey | null = null;

      for (let j = 0; j < paletteRes.swatches.length; j += 1) {
        const swatchRes = paletteRes.swatches[j];
        const swatch: IPaletteSwatch = {
          uid: swatchRes.uid,
          isDefault: swatchRes.isDefault,
          swatch: JSON.parse(swatchRes.swatch),
        };

        if (swatch.isDefault) {
          defaultSwatch = swatch.uid;
        }

        palette.swatches[swatch.uid] = swatch;
        palette.swatchOrder.push(swatch.uid);
      }

      defaultSwatch = defaultSwatch || palette.swatchOrder[0];

      if (palette.isPublic) {
        builtinPalettes.value[palette.paletteType as PALETTE_TYPES] = {
          palette: palette.uid,
          swatch: defaultSwatch,
        };
      }

      if (paletteRes.collections.length > 0) {
        for (let k = 0; k < paletteRes.collections.length; k += 1) {
          const collectionRes = paletteRes.collections[k];
          const collectionUid = collectionRes.uid;
          paletteCollections.value[collectionUid] = [...collectionRes.paletteOrder];
        }
      }

      palettes.value[palette.uid] = palette;
    }
  }

  async function fetchMyPalettes() {
    const { data } = await useQuery({
      query: MyPalettesDocument,
      cachePolicy: "network-only",
    });

    const res = processGraphqlData(data.value, true);

    storePalettes(res.myPalettes);
  }

  async function createPalette() {
    const { execute, data } = useMutation(CreatePaletteDocument);
    const swatches = Array(MAX_SWATCH_COLORS).fill(JSON.stringify(TRANSPARENT_COLOR));
    await execute({ swatches });

    const res = processGraphqlData(data.value.createPalette?.palette, true);
    storePalettes([res]);
  }

  async function updateSwatchColor(paletteUid: TPrimaryKey, swatchUid: TPrimaryKey, color: TColor) {
    const { execute, data } = useMutation(UpdatePaletteSwatchDocument);
    await execute({ uid: swatchUid, swatch: JSON.stringify(color) });

    const swatch = data.value.updatePaletteSwatch?.swatch;
    if (swatch) {
      const paletteUid = swatch.palette.uid;
      const swatchUid = swatch.uid;
      palettes.value[paletteUid].swatches[swatchUid].swatch = JSON.parse(swatch.swatch);
    }
  }

  async function fetchNotebook(uid: TPrimaryKey) {
    const { data } = await useQuery({
      query: MyNotebooksDocument,
      variables: { uid },
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
    notebooks.value[uid] = merge(notebooks.value[uid], {
      uid: rawNotebook.uid,
      updatedAt: rawNotebook.updatedAt,
      createdAt: rawNotebook.createdAt,
      title: rawNotebook.title,
      pageOrder: rawNotebook.pageOrder,
      bookshelfUid: rawNotebook.bookshelf.uid,
    });

    for (let i = 0; i < res.pages.length; i += 1) {
      const { uid, updatedAt, createdAt, notebook } = res.pages[i];
      pages.value[uid] = { uid, updatedAt, createdAt, notebookUid: notebook.uid } as IPage;
    }

    return notebooks.value[uid];
  }

  async function createNotebook(bookshelfUid: TPrimaryKey, title = "Untitled") {
    const { execute, data } = useMutation(CreateNotebookDocument);
    await execute({ bookshelfUid, title });

    const notebook = data.value.createNotebook?.notebook;
    if (typeof notebook === "undefined" || notebook === null) {
      throw new Error("Failed to create notebook");
    }

    notebooks.value[notebook.uid] = {
      uid: notebook.uid,
      title: notebook.title,
      pageOrder: notebook.pageOrder,
      updatedAt: notebook.updatedAt,
      createdAt: notebook.createdAt,
      bookshelfUid: notebook.bookshelf.uid,
    };

    bookshelves.value[notebook.bookshelf.uid] = merge(
      bookshelves.value[notebook.bookshelf.uid],
      notebook.bookshelf
    );

    return notebooks.value[notebook.uid];
  }

  function storePage(page: any) {
    const currPage = pages.value[page.uid];
    const formattedPage: Partial<IPage> = {
      uid: page.uid,
      updatedAt: page.updatedAt,
      createdAt: page.createdAt,
      notebookUid: page.notebook.uid,
      paperSwatchUid: page.paperSwatch
        ? page.paperSwatch.uid
        : builtinPalettes.value[PALETTE_TYPES.PAPER]?.swatch,
      paperPaletteUid: page.paperSwatch
        ? page.paperSwatch.palette.uid
        : builtinPalettes.value[PALETTE_TYPES.PAPER]?.palette,
      patternSwatchUid: page.patternSwatch
        ? page.patternSwatch.uid
        : builtinPalettes.value[PALETTE_TYPES.PATTERN]?.swatch,
      patternPaletteUid: page.patternSwatch
        ? page.patternSwatch.palette.uid
        : builtinPalettes.value[PALETTE_TYPES.PATTERN]?.palette,
      patternType: page.patternType ? page.patternType : DEFAULT_PATTERN_TYPE,
      patternSize: typeof page.patternSize !== "undefined" ? page.patternSize : null,
      patternSpacing: typeof page.patternSpacing !== "undefined" ? page.patternSpacing : null,
      patternOpacity: page.patternOpacity ? page.patternOpacity : DEFAULT_PATTERN_OPACITY,
    };

    pages.value[page.uid] = merge(currPage, formattedPage);

    notebooks.value[page.notebook.uid] = merge(notebooks.value[page.notebook.uid], page.notebook);

    return pages.value[page.uid];
  }

  async function fetchPage(uid: TPrimaryKey) {
    const { data } = await useQuery({
      query: MyPagesDocument,
      variables: { uid },
      cachePolicy: "network-only",
    });
    const res = processGraphqlData(data.value);

    if (typeof res.myPages === "undefined" || res.myPages === null || res.myPages.length === 0) {
      return;
    }

    const page = res.myPages[0];
    return storePage(page);
  }

  async function createPage(notebook: TPrimaryKey) {
    const { execute, data } = useMutation(CreatePageDocument);
    const paperSwatchUid = builtinPalettes.value[PALETTE_TYPES.PAPER].swatch;

    await execute({ notebook, paperSwatchUid });

    const page = data.value.createPage?.page;
    if (typeof page === "undefined" || page === null) {
      throw new Error("Failed to create page");
    }

    return storePage(page);
  }

  async function updatePage(uid: TPrimaryKey, page: Partial<IPage>) {
    const { execute, data } = useMutation(UpdatePageDocument);
    await execute({ uid, ...page });

    const updatedPage = data.value.updatePage?.page;
    if (typeof updatedPage === "undefined" || updatedPage === null) {
      throw new Error("Failed to update page");
    }

    return storePage(updatedPage);
  }

  async function fetchElements(pageUid: TPrimaryKey) {
    console.log("fetching elements for pageUid", pageUid);
    const { data } = await useQuery({
      query: MyElementsDocument,
      variables: { pageUid },
      cachePolicy: "network-only",
    });

    const res = processGraphqlData(data.value);
    console.log(res, data.value);

    // if (
    //   typeof res.myElements === "undefined" ||
    //   res.myElements === null ||
    //   res.myElements.length === 0
    // ) {
    //   return;
    // }
  }

  async function createElement(page: TPrimaryKey, { tool, render, options }: Partial<IElement>) {
    const { execute, data } = useMutation(CreateElementDocument);
    await execute({
      page,
      tool: tool as number,
      render: JSON.stringify(render),
      options: JSON.stringify(options),
    });

    const createdElement = data.value.createElement?.element;
    if (typeof createdElement === "undefined" || createdElement === null) {
      throw new Error("Failed to create element");
    }

    // return storeElement(element);
  }

  return {
    rooms,
    myRoom,
    fetchMyRooms,

    bookshelves,
    myBookshelf,

    paletteCollections,
    defaultPaletteCollection,
    palettes,
    getSwatchColor,
    builtinPalettes,
    fetchMyPalettes,
    createPalette,
    updateSwatchColor,

    notebooks,
    fetchNotebook,
    createNotebook,

    pages,
    fetchPage,
    createPage,
    updatePage,

    elements,
    fetchElements,
    createElement,
  };
});
