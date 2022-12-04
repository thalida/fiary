import { getStroke } from "perfect-freehand";
import { ELEMENT_TYPE, CANVAS_LINE_TOOLS, LineEndSide, LineEndStyle } from "@/constants/core";
import type {
  IAPIElement,
  ICanvasSettings,
  ICutElementSettings,
  IElement,
  IElementDimensions,
  IElementPoint,
  ILineElementSettings,
  TPrimaryKey,
} from "@/types/core";
import { formatColor, isTransparent } from "@/utils/color";
import BaseElement from "./BaseElement";
import merge from "lodash/merge";

export default class BaseCanvasElement extends BaseElement {
  declare canvasSettings: ICanvasSettings;
  dimensions: IElementDimensions;

  constructor(
    element: IAPIElement | ({ pageUid: TPrimaryKey; tool: ELEMENT_TYPE } & Partial<IElement>),
    fromApi = false
  ) {
    super(element, fromApi);

    this.canvasSettings = merge(this.canvasSettings, {
      dpi: window.devicePixelRatio,
    });

    this.canvasSettings.composition = this.getComposition();
    this.canvasSettings.opacity = 1;

    if (
      CANVAS_LINE_TOOLS.includes(this.tool) &&
      (typeof this.canvasSettings.smoothPoints === "undefined" ||
        this.canvasSettings.smoothPoints === null)
    ) {
      this.canvasSettings.smoothPoints = this.smoothPoints();
    }

    this.dimensions = this.calculateDimensions();
  }

  getComposition() {
    if (this.tool === ELEMENT_TYPE.ERASER || this.tool === ELEMENT_TYPE.CLEAR_ALL) {
      return "destination-out";
    }

    if (this.tool === ELEMENT_TYPE.MARKER) {
      return "multiply";
    }

    if (this.tool === ELEMENT_TYPE.HIGHLIGHTER) {
      return "hue";
    }

    return "source-over";
  }

  calculateDimensions() {
    let xPoints, yPoints;
    if (CANVAS_LINE_TOOLS.includes(this.tool)) {
      xPoints = this.canvasSettings.smoothPoints.path.map((point: number[]) => point[0]);
      yPoints = this.canvasSettings.smoothPoints.path.map((point: number[]) => point[1]);
    } else {
      xPoints = this.points.map(({ x }: { x: number }) => x);
      yPoints = this.points.map(({ y }: { y: number }) => y);
    }

    const minX = Math.min(...xPoints);
    const minY = Math.min(...yPoints);
    const maxX = Math.max(...xPoints);
    const maxY = Math.max(...yPoints);
    const width = maxX - minX;
    const height = maxY - minY;

    let outerMinX = minX;
    let outerMinY = minY;
    let outerMaxX = maxX;
    let outerMaxY = maxY;

    if (CANVAS_LINE_TOOLS.includes(this.tool) && !isTransparent(this.canvasSettings.strokeColor)) {
      const outerXPoints = this.canvasSettings.smoothPoints.stroke.map(
        (point: number[]) => point[0]
      );
      const outerYPoints = this.canvasSettings.smoothPoints.stroke.map(
        (point: number[]) => point[1]
      );
      outerMinX = Math.min(...outerXPoints);
      outerMinY = Math.min(...outerYPoints);
      outerMaxX = Math.max(...outerXPoints);
      outerMaxY = Math.max(...outerYPoints);
    } else if (this.tool === ELEMENT_TYPE.LINE && this.canvasSettings.lineSize !== null) {
      const strokeSize = !isTransparent(this.canvasSettings.strokeColor)
        ? this.canvasSettings.lineSize * 0.75
        : this.canvasSettings.lineSize / 2;
      outerMinX -= strokeSize;
      outerMinY -= strokeSize;
      outerMaxX += strokeSize;
      outerMaxY += strokeSize;
    } else {
      let strokeSize = 0;
      if (
        this.canvasSettings.lineSize !== null &&
        (!isTransparent(this.canvasSettings.strokeColor) ||
          this.tool === ELEMENT_TYPE.BLOB ||
          this.tool === ELEMENT_TYPE.ERASER)
      ) {
        strokeSize = this.canvasSettings.lineSize / 2;
      }

      outerMinX -= strokeSize;
      outerMinY -= strokeSize;
      outerMaxX += strokeSize;
      outerMaxY += strokeSize;
    }

    const outerWidth = outerMaxX - outerMinX;
    const outerHeight = outerMaxY - outerMinY;
    const dimensions = {
      minX,
      minY,
      maxX,
      maxY,
      outerMinX,
      outerMinY,
      outerMaxX,
      outerMaxY,
      width,
      height,
      outerWidth,
      outerHeight,
      lineLength: null as number | null,
    };

    if (CANVAS_LINE_TOOLS.includes(this.tool)) {
      dimensions.lineLength = Math.sqrt(
        Math.pow(dimensions.width, 2) + Math.pow(dimensions.height, 2)
      );
    }

    return dimensions;
  }

  calculateLinePoints(toPos: { x: number; y: number }): IElementPoint[] {
    const fromx = this.points[0].x;
    const fromy = this.points[0].y;
    const tox = toPos.x;
    const toy = toPos.y;

    const settings = this.settings as unknown as ILineElementSettings;

    if (settings.lineEndStyle === LineEndStyle.NONE || settings.lineEndSide === LineEndSide.NONE) {
      return [
        { x: fromx, y: fromy },
        { x: toPos.x, y: toPos.y },
      ];
    } else if (
      settings.lineEndStyle === LineEndStyle.ARROW &&
      this.canvasSettings.lineSize !== null
    ) {
      const headlen = this.canvasSettings.lineSize * 2; // length of head in pixels
      const endAngle = Math.atan2(toy - fromy, tox - fromx);
      const endA1 = {
        x: tox - headlen * Math.cos(endAngle - Math.PI / 5),
        y: toy - headlen * Math.sin(endAngle - Math.PI / 5),
      };
      const endA2 = {
        x: tox - headlen * Math.cos(endAngle + Math.PI / 5),
        y: toy - headlen * Math.sin(endAngle + Math.PI / 5),
      };
      const endPoints = [endA1, endA2];

      let startAngle;
      let startPoints: IElementPoint[] = [];
      if (settings.lineEndSide === LineEndSide.BOTH) {
        startAngle = Math.atan2(fromy - toy, fromx - tox);
        const startA1 = {
          x: fromx - headlen * Math.cos(startAngle - Math.PI / 5),
          y: fromy - headlen * Math.sin(startAngle - Math.PI / 5),
        };
        const startA2 = {
          x: fromx - headlen * Math.cos(startAngle + Math.PI / 5),
          y: fromy - headlen * Math.sin(startAngle + Math.PI / 5),
        };
        startPoints = [startA1, startA2];
      }

      return [{ x: fromx, y: fromy }, ...startPoints, ...endPoints, { x: toPos.x, y: toPos.y }];
    } else if (
      this.canvasSettings.lineSize !== null &&
      (settings.lineEndStyle === LineEndStyle.SQUARE ||
        settings.lineEndStyle === LineEndStyle.CIRCLE)
    ) {
      const headSize = this.canvasSettings.lineSize * 2;
      const endStartPoint = {
        x: tox - headSize / 2,
        y: toy - headSize / 2,
      };
      const endEndPoint = {
        x: tox + headSize / 2,
        y: toy + headSize / 2,
      };
      const endPoints = [endStartPoint, endEndPoint];

      let startPoints: IElementPoint[] = [];
      if (settings.lineEndSide === LineEndSide.BOTH) {
        const startStartPoint = {
          x: fromx - headSize / 2,
          y: fromy - headSize / 2,
        };
        const startEndPoint = {
          x: fromx + headSize / 2,
          y: fromy + headSize / 2,
        };
        startPoints = [startStartPoint, startEndPoint];
      }

      return [{ x: fromx, y: fromy }, ...startPoints, ...endPoints, { x: toPos.x, y: toPos.y }];
    }

    return [];
  }

  smoothPoints() {
    const stroke = getStroke(this.points, {
      ...this.canvasSettings.freehandOptions,
      size: this.canvasSettings.freehandOptions.size * 1.5,
      thinning: this.canvasSettings.freehandOptions.thinning / 1.5,
    });
    const path = getStroke(this.points, this.canvasSettings.freehandOptions);
    const strokeSvgPath = this.svgPathFromStroke(stroke);
    const pathSvgPath = this.svgPathFromStroke(path);
    return {
      stroke,
      path,
      strokeSvgPath,
      pathSvgPath,
    };
  }

  svgPathFromStroke(points: number[][]) {
    if (!points.length) return "";

    const d = points.reduce(
      (acc, [x0, y0], i, arr) => {
        const [x1, y1] = arr[(i + 1) % arr.length];
        acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
        return acc;
      },
      ["M", ...points[0], "Q"]
    );

    d.push("Z");
    return d.join(" ");
  }

  cacheElement() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (ctx === null || this.dimensions === null) {
      return;
    }

    const dpi = this.canvasSettings.dpi;

    const minX = this.dimensions.outerMinX;
    const minY = this.dimensions.outerMinY;
    const width = this.dimensions.outerWidth;
    const height = this.dimensions.outerHeight;

    canvas.width = width * dpi;
    canvas.height = height * dpi;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.save();
    ctx.scale(dpi, dpi);
    ctx.translate(-minX, -minY);
    this.drawElement(canvas, true);
    ctx.restore();

    this.canvasDataUrl = canvas.toDataURL();

    const img = new Image();
    img.onload = () => {
      this.cachedCanvasImage = img;
      this.isCached = true;
    };
    img.src = this.canvasDataUrl;
  }

  drawElement(canvas: HTMLCanvasElement, isCaching = false, isDebugMode = false) {
    if (
      this.isHtmlElement ||
      this.isHidden ||
      this.dimensions.outerWidth === 0 ||
      this.dimensions.outerHeight === 0
    ) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (ctx === null) {
      return;
    }

    if (
      this.isCached &&
      typeof this.cachedCanvasImage !== "undefined" &&
      this.cachedCanvasImage !== null
    ) {
      ctx.save();
      ctx.globalCompositeOperation = this.canvasSettings.composition as GlobalCompositeOperation;
      ctx.translate(this.dimensions.outerMinX, this.dimensions.outerMinY);
      ctx.drawImage(
        this.cachedCanvasImage,
        0,
        0,
        this.dimensions.outerWidth,
        this.dimensions.outerHeight
      );
      ctx.restore();
      if (isDebugMode) {
        ctx.save();
        ctx.beginPath();
        ctx.translate(this.dimensions.outerMinX, this.dimensions.outerMinY);
        ctx.rect(0, 0, this.dimensions.outerWidth, this.dimensions.outerHeight);
        ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.restore();
      }
      return;
    }

    const points = this.points.slice();
    const { minX, minY, maxX, maxY } = this.dimensions;

    ctx.save();

    if (
      isCaching &&
      (this.tool === ELEMENT_TYPE.ERASER ||
        this.tool === ELEMENT_TYPE.CUT ||
        this.tool === ELEMENT_TYPE.CLEAR_ALL)
    ) {
      ctx.globalCompositeOperation = "source-over";
    } else {
      ctx.globalCompositeOperation = this.canvasSettings.composition as GlobalCompositeOperation;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (this.canvasSettings.lineSize !== null) {
      ctx.lineWidth = this.canvasSettings.lineSize;
    }

    if (Array.isArray(this.canvasSettings.strokeColor)) {
      let gradientStartX, gradientStartY, gradientEndX, gradientEndY;

      if (Math.abs(minX - points[0].x) <= Math.abs(maxX - points[0].x)) {
        gradientStartX = minX;
        gradientEndX = maxX;
      } else {
        gradientStartX = maxX;
        gradientEndX = minX;
      }

      if (Math.abs(minY - points[0].y) <= Math.abs(maxY - points[0].y)) {
        gradientStartY = minY;
        gradientEndY = maxY;
      } else {
        gradientStartY = maxY;
        gradientEndY = minY;
      }

      const gradient = ctx.createLinearGradient(
        gradientStartX,
        gradientStartY,
        gradientEndX,
        gradientEndY
      );
      for (let j = 0; j < this.canvasSettings.strokeColor.length; j += 1) {
        const colorStop = this.canvasSettings.strokeColor[j];
        const stop = colorStop.percent / 100;
        const color = formatColor(colorStop.color, this.canvasSettings.opacity);
        gradient.addColorStop(stop, color);
      }
      ctx.strokeStyle = gradient;
    } else {
      ctx.strokeStyle = formatColor(this.canvasSettings.strokeColor, this.canvasSettings.opacity);
    }

    if (Array.isArray(this.canvasSettings.fillColor)) {
      let gradientStartX, gradientStartY, gradientEndX, gradientEndY;
      if (Math.abs(minX - points[0].x) <= Math.abs(maxX - points[0].x)) {
        gradientStartX = minX;
        gradientEndX = maxX;
      } else {
        gradientStartX = maxX;
        gradientEndX = minX;
      }
      if (Math.abs(minY - points[0].y) <= Math.abs(maxY - points[0].y)) {
        gradientStartY = minY;
        gradientEndY = maxY;
      } else {
        gradientStartY = maxY;
        gradientEndY = minY;
      }

      const gradient = ctx.createLinearGradient(
        gradientStartX,
        gradientStartY,
        gradientEndX,
        gradientEndY
      );
      for (let j = 0; j < this.canvasSettings.fillColor.length; j += 1) {
        const colorStop = this.canvasSettings.fillColor[j];
        const stop = colorStop.percent / 100;
        const color = formatColor(colorStop.color, this.canvasSettings.opacity);
        gradient.addColorStop(stop, color);
      }
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = formatColor(this.canvasSettings.fillColor, this.canvasSettings.opacity);
    }

    if (CANVAS_LINE_TOOLS.includes(this.tool)) {
      ctx.save();
      ctx.beginPath();
      const strokePoints = this.canvasSettings.smoothPoints.stroke;
      ctx.moveTo(strokePoints[0][0], strokePoints[0][1]);
      // const strokeData = this.svgPathFromStroke(strokePoints);
      const myStroke = new Path2D(this.canvasSettings.smoothPoints.strokeSvgPath);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill(myStroke);
      ctx.restore();

      ctx.save();
      if (isTransparent(this.canvasSettings.fillColor)) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "#fff";
      }
      ctx.beginPath();
      const pathPoints = this.canvasSettings.smoothPoints.path;
      ctx.moveTo(pathPoints[0][0], pathPoints[0][1]);
      // const pathData = this.svgPathFromStroke(pathPoints);
      const myPath = new Path2D(this.canvasSettings.smoothPoints.pathSvgPath);
      ctx.fill(myPath);
      ctx.restore();
    } else if (this.tool === ELEMENT_TYPE.CIRCLE) {
      ctx.beginPath();
      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;
      const radX = Math.abs(midX - minX);
      const radY = Math.abs(midY - minY);

      ctx.ellipse(midX, midY, radX, radY, 0, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fill();
    } else if (this.tool === ELEMENT_TYPE.TRIANGLE) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.lineTo(points[2].x, points[2].y);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    } else if (this.tool === ELEMENT_TYPE.RECTANGLE) {
      ctx.beginPath();
      const rectangle = new Path2D();
      const width = maxX - minX;
      const height = maxY - minY;
      rectangle.rect(minX, minY, width, height);
      ctx.stroke(rectangle);
      ctx.fill(rectangle);
    } else if (this.tool === ELEMENT_TYPE.LINE) {
      const numPoints = points.length;
      const fromx = points[0].x;
      const fromy = points[0].y;
      const tox = points[points.length - 1].x;
      const toy = points[points.length - 1].y;

      ctx.save();
      ctx.lineWidth *= 1.5;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.moveTo(fromx, fromy);
      ctx.lineTo(tox, toy);
      ctx.stroke();

      if ((this.settings as ILineElementSettings).lineEndStyle === LineEndStyle.ARROW) {
        ctx.beginPath();
        for (let i = points.length - 2; i > 0; i -= 1) {
          const targetPoint = numPoints > 4 && i <= 2 ? points[0] : points[numPoints - 1];
          ctx.moveTo(targetPoint.x, targetPoint.y);
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
      } else if (
        (this.settings as ILineElementSettings).lineEndStyle === LineEndStyle.SQUARE &&
        this.canvasSettings.lineSize !== null
      ) {
        ctx.lineWidth = this.canvasSettings.lineSize / 2;
        ctx.beginPath();
        for (let i = 1; i < points.length - 1; i += 2) {
          const startPoint = points[i];
          const endPoint = points[i + 1];
          const width = endPoint.x - startPoint.x;
          const height = endPoint.y - startPoint.y;
          ctx.rect(startPoint.x, startPoint.y, width, height);
        }
        ctx.fill();
        ctx.stroke();
      } else if (
        (this.settings as ILineElementSettings).lineEndStyle === LineEndStyle.CIRCLE &&
        this.canvasSettings.lineSize !== null
      ) {
        ctx.lineWidth = this.canvasSettings.lineSize / 2;
        ctx.beginPath();
        for (let i = 1; i < points.length - 1; i += 2) {
          const startPoint = points[i];
          const endPoint = points[i + 1];
          const centerX = (startPoint.x + endPoint.x) / 2;
          const centerY = (startPoint.y + endPoint.y) / 2;
          const radius =
            Math.sqrt(
              Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
            ) / 2;
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        }
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = ctx.fillStyle;
      ctx.beginPath();
      ctx.moveTo(fromx, fromy);
      ctx.lineTo(tox, toy);
      ctx.stroke();

      if ((this.settings as ILineElementSettings).lineEndStyle === LineEndStyle.ARROW) {
        ctx.beginPath();
        for (let i = points.length - 2; i > 0; i -= 1) {
          const targetPoint = numPoints > 4 && i <= 2 ? points[0] : points[numPoints - 1];
          ctx.moveTo(targetPoint.x, targetPoint.y);
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
      } else if ((this.settings as ILineElementSettings).lineEndStyle === LineEndStyle.SQUARE) {
        ctx.beginPath();
        for (let i = 1; i < points.length - 1; i += 2) {
          const startPoint = points[i];
          const endPoint = points[i + 1];
          const width = endPoint.x - startPoint.x;
          const height = endPoint.y - startPoint.y;
          ctx.rect(startPoint.x, startPoint.y, width, height);
        }
        ctx.fill();
      } else if ((this.settings as ILineElementSettings).lineEndStyle === LineEndStyle.CIRCLE) {
        ctx.beginPath();
        for (let i = 1; i < points.length - 1; i += 2) {
          const startPoint = points[i];
          const endPoint = points[i + 1];
          const centerX = (startPoint.x + endPoint.x) / 2;
          const centerY = (startPoint.y + endPoint.y) / 2;
          const radius =
            Math.sqrt(
              Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
            ) / 2;
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        }
        ctx.fill();
      }
      ctx.restore();
    } else if (this.tool === ELEMENT_TYPE.BLOB || this.tool === ELEMENT_TYPE.ERASER) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      let i = 0;
      for (i = 0; i < points.length - 2; i += 1) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }

      if (points.length >= 2) {
        ctx.quadraticCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
      }

      if (this.tool === ELEMENT_TYPE.BLOB) {
        ctx.closePath();
        ctx.save();
        if (isTransparent(this.canvasSettings.strokeColor)) {
          ctx.strokeStyle = ctx.fillStyle;
        }
        ctx.stroke();
        ctx.fill();
        ctx.restore();
      } else if (this.tool === ELEMENT_TYPE.ERASER) {
        ctx.save();
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        ctx.restore();
      }
    } else if (this.tool === ELEMENT_TYPE.CUT) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      let i = 0;
      for (i = 0; i < points.length - 2; i += 1) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }

      if (points.length >= 2) {
        ctx.quadraticCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
      }

      if ((this.settings as ICutElementSettings).isCompletedCut) {
        ctx.closePath();
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      } else {
        ctx.setLineDash([10, 10]);
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#0000ff";
        ctx.stroke();
      }
    } else if (this.tool === ELEMENT_TYPE.CLEAR_ALL) {
      ctx.beginPath();
      const rectangle = new Path2D();
      const width = maxX - minX;
      const height = maxY - minY;
      rectangle.rect(minX, minY, width, height);
      ctx.fill(rectangle);
    }

    ctx.restore();
  }
}
