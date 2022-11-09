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
} from "@/api/graphql-operations";
import type {
  IBookshelves,
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
  const paletteCollections = ref({} as { [key: TPrimaryKey]: TPrimaryKey[] });
  const palettes = ref({} as IPalettes);
  const defaultPalettes = ref(
    {} as { [key in PALETTE_TYPES]: { palette: TPrimaryKey; swatch: TPrimaryKey } }
  );
  const getSwatchColor = computed(
    () => (paletteId: TPrimaryKey | null, swatchId: TPrimaryKey | null) => {
      if (paletteId === null || swatchId === null) {
        return TRANSPARENT_COLOR;
      }

      const palette = palettes.value[paletteId];
      const swatch = palette.swatches[swatchId];
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

  function storePalettes(res: any[]) {
    for (let i = 0; i < res.length; i += 1) {
      const paletteRes = res[i];
      const palette: IPalette = {
        pk: paletteRes.pk,
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
          pk: swatchRes.pk,
          isDefault: swatchRes.isDefault,
          swatch: JSON.parse(swatchRes.swatch),
        };

        if (swatch.isDefault) {
          defaultSwatch = swatch.pk;
        }

        palette.swatches[swatch.pk] = swatch;
        palette.swatchOrder.push(swatch.pk);
      }

      defaultSwatch = defaultSwatch || palette.swatchOrder[0];

      if (palette.isPublic) {
        defaultPalettes.value[palette.paletteType as PALETTE_TYPES] = {
          palette: palette.pk,
          swatch: defaultSwatch,
        };
      }

      if (paletteRes.collections.length > 0) {
        for (let k = 0; k < paletteRes.collections.length; k += 1) {
          const collectionRes = paletteRes.collections[k];
          const collectionPk = collectionRes.pk;
          paletteCollections.value[collectionPk] = [...collectionRes.paletteOrder];
        }
      }

      palettes.value[palette.pk] = palette;
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

  async function updateSwatchColor(paletteId: TPrimaryKey, swatchId: TPrimaryKey, color: TColor) {
    const { execute, data } = useMutation(UpdatePaletteSwatchDocument);
    await execute({ pk: swatchId, swatch: JSON.stringify(color) });

    const swatch = data.value.updatePaletteSwatch?.swatch;
    if (swatch) {
      const palettePk = swatch.palette.pk;
      const swatchPk = swatch.pk;
      palettes.value[palettePk].swatches[swatchPk].swatch = JSON.parse(swatch.swatch);
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
      paperSwatch: page.paperSwatch
        ? page.paperSwatch.pk
        : defaultPalettes.value[PALETTE_TYPES.PAPER]?.swatch,
      paperPalette: page.paperSwatch
        ? page.paperSwatch.palette.pk
        : defaultPalettes.value[PALETTE_TYPES.PAPER]?.palette,
      patternSwatch: page.patternSwatch
        ? page.patternSwatch.pk
        : defaultPalettes.value[PALETTE_TYPES.PATTERN]?.swatch,
      patternPalette: page.patternSwatch
        ? page.patternSwatch.palette.pk
        : defaultPalettes.value[PALETTE_TYPES.PATTERN]?.palette,
      patternType: page.patternType ? page.patternType : DEFAULT_PATTERN_TYPE,
      patternSize: typeof page.patternSize !== "undefined" ? page.patternSize : null,
      patternSpacing: typeof page.patternSpacing !== "undefined" ? page.patternSpacing : null,
      patternOpacity: page.patternOpacity ? page.patternOpacity : DEFAULT_PATTERN_OPACITY,
    };

    pages.value[page.pk] = merge(currPage, formattedPage);

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
    const paperSwatchPk = defaultPalettes.value[PALETTE_TYPES.PAPER].swatch;

    await execute({ notebookPk, paperSwatchPk });

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

    paletteCollections,
    palettes,
    getSwatchColor,
    defaultPalettes,
    fetchMyPalettes,
    createPalette,
    updateSwatchColor,

    notebooks,
    fetchNotebook,
    createNotebook,

    pages,
    fetchPage,
    createPage,
  };
});
