import { v4 as uuidv4 } from "uuid";
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
  IImageElementSettings,
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
  ELEMENT_TYPE,
  MAX_SWATCH_COLORS,
  PageHistoryEvent,
  PALETTE_TYPES,
  TRANSPARENT_COLOR,
} from "@/constants/core";
import type BaseElement from "@/models/BaseElement";

export const useCoreStore = defineStore("core", () => {
  const rooms = ref({} as IRooms);
  const bookshelves = ref({} as IBookshelves);
  const notebooks = ref({} as INotebooks);
  const pages = ref({} as IPages);
  const elements = ref({} as { [key: TPrimaryKey]: BaseElement });
  const clearAllElementIndexes = ref({} as { [key: TPrimaryKey]: number[] });
  const history = ref({} as { [key: TPrimaryKey]: any[] });
  const historyIndex = ref({} as { [key: TPrimaryKey]: number });
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

  const activeElementsStartIdx = computed(() => (pageUid: TPrimaryKey) => {
    return clearAllElementIndexes.value[pageUid].length > 0
      ? clearAllElementIndexes.value[pageUid][clearAllElementIndexes.value[pageUid].length - 1]
      : 0;
  });
  const activeElements = computed(() => (pageUid: TPrimaryKey) => {
    const startIdx = activeElementsStartIdx.value(pageUid);
    const postClear = pages.value[pageUid].elementOrder.slice(startIdx);
    return postClear.filter((uid) => !elements.value[uid].isHidden);
  });
  const lastActiveElementUid = computed(() => (pageUid: TPrimaryKey) => {
    const elements = activeElements.value(pageUid);
    return elements[elements.length - 1];
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

    if (typeof pages.value[page.uid].elementOrder === "undefined") {
      pages.value[page.uid].elementOrder = [];
    }

    if (typeof history.value[page.uid] === "undefined") {
      history.value[page.uid] = [];
      historyIndex.value[page.uid] = -1;
    }

    if (typeof clearAllElementIndexes.value[page.uid] === "undefined") {
      clearAllElementIndexes.value[page.uid] = [];
    }

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

  async function createPage(notebookUid: TPrimaryKey) {
    const { execute, data } = useMutation(CreatePageDocument);
    const paperSwatchUid = builtinPalettes.value[PALETTE_TYPES.PAPER].swatch;

    await execute({ notebookUid, paperSwatchUid });

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
    const { data } = await useQuery({
      query: MyElementsDocument,
      variables: { pageUid },
      cachePolicy: "network-only",
    });

    const res = processGraphqlData(data.value);

    if (
      typeof res.myElements === "undefined" ||
      res.myElements === null ||
      res.myElements.length === 0
    ) {
      return;
    }

    // for (let i = 0; i < res.myElements.length; i += 1) {
    //   const element = res.myElements[i];
    //   storeElement(element);
    // }

    console.log(res);
    console.log("elements", elements.value);
  }

  function setElement(element: BaseElement) {
    const page = pages.value[element.pageUid];
    elements.value[element.uid as string] = element;
    page.elementOrder.push(element.uid as string);

    return elements.value[element.uid as string];
  }

  async function createElement(pageUid: TPrimaryKey, element: BaseElement) {
    element.uid = uuidv4() as TPrimaryKey;
    setElement(element);

    const updatedElement = showElement(element.uid);
    const historyEvent: any = {
      type: PageHistoryEvent.ADD_CANVAS_ELEMENT,
      elementUid: element.uid,
    };

    if (element.tool === ELEMENT_TYPE.IMAGE) {
      historyEvent.image = (element.settings as IImageElementSettings).image;
    }
    addHistoryEvent(pageUid, historyEvent);

    return updatedElement;

    // const { execute, data } = useMutation(CreateElementDocument);
    // const params = {
    //   pageUid,
    //   ...element,
    //   tool: element.tool as number,
    //   points: JSON.stringify(element.points),
    //   settings: JSON.stringify(element.settings),
    //   styles: JSON.stringify(element.styles),
    // };
    // await execute(params);

    // const createdElement = data.value.createElement?.element;
    // if (typeof createdElement === "undefined" || createdElement === null) {
    //   throw new Error("Failed to create element");
    // }

    // element.uid = uuidv4() as TPrimaryKey;

    // showElement(element.uid);

    // const historyEvent: any = {
    //   type: PageHistoryEvent.ADD_CANVAS_ELEMENT,
    //   elementUid: element.uid,
    // };
    // if (element.tool === ELEMENT_TYPE.IMAGE) {
    //   historyEvent.image = (element.settings as IImageElementSettings).image;
    // }
    // addHistoryEvent(pageUid, historyEvent);

    // return elements.value[element.uid];
  }

  function updateElement(element: BaseElement) {}

  function deleteElement(elementUid: TPrimaryKey, trackHistory = true) {
    hideElement(elementUid);

    if (trackHistory) {
      const pageUid = elements.value[elementUid].pageUid;
      addHistoryEvent(pageUid, {
        type: PageHistoryEvent.REMOVE_CANVAS_ELEMENT,
        elementUid: elementUid,
      });
    }
    return elements.value[elementUid];
  }

  function showElement(elementUid: TPrimaryKey) {
    const element = elements.value[elementUid];
    element.isHidden = false;

    if (element.tool === ELEMENT_TYPE.CLEAR_ALL) {
      const page = pages.value[element.pageUid];
      const elementIndex = page.elementOrder.indexOf(elementUid);
      clearAllElementIndexes.value[element.pageUid].push(elementIndex);
      clearAllElementIndexes.value[element.pageUid].sort((a, b) => a - b);
    }

    return element;
  }

  function hideElement(elementUid: TPrimaryKey) {
    const element = elements.value[elementUid];
    element.isHidden = true;

    if (element.tool === ELEMENT_TYPE.CLEAR_ALL) {
      const page = pages.value[element.pageUid];
      const elementIndex = page.elementOrder.indexOf(elementUid);
      clearAllElementIndexes.value[element.pageUid] = clearAllElementIndexes.value[
        element.pageUid
      ].filter((i) => i !== elementIndex);
    }

    return element;
  }

  function addHistoryEvent(pageUid: TPrimaryKey, event: any) {
    history.value[pageUid].splice(historyIndex.value[pageUid] + 1);
    history.value[pageUid].push(event);
    historyIndex.value[pageUid] = history.value[pageUid].length - 1;
  }

  function popHistoryEvent(pageUid: TPrimaryKey) {
    if (historyIndex.value[pageUid] < 0) return;
    history.value[pageUid].pop();
    historyIndex.value[pageUid] -= 1;
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
    activeElements,
    lastActiveElementUid,
    fetchElements,
    createElement,
    deleteElement,
    updateElement,
    showElement,
    hideElement,

    history,
    historyIndex,
    addHistoryEvent,
    popHistoryEvent,
  };
});
