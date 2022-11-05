import { getStroke } from "perfect-freehand";
import { CanvasTool, CANVAS_LINE_TOOLS, LineEndSide, LineEndStyle } from "@/constants/core";
import type { IElementPoint, ILineElementOptions, TColor } from "@/types/core";
import { formatColor, isTransparent } from "@/utils/color";
import BaseElement from "./BaseElement";

export default class BaseCanvasElement extends BaseElement {
  store: any;
  tool: CanvasTool;
  toolOptions: { [key: string]: any } = {};
  composition: string;
  fillColor: TColor | undefined;
  strokeColor: TColor | undefined;
  dimensions: any = {};
  isDrawingCached = false;
  cache: any = {};
  smoothPoints: any = {};
  freehandOptions: { [key: string]: any } = {};
  size: number | null = null;
  opacity = 1;
  isCompletedCut: boolean | null = null;
  isRulerLine: boolean | null = null;

  constructor({
    tool,
    strokeColor,
    fillColor,
  }: {
    tool: CanvasTool;
    strokeColor?: TColor;
    fillColor?: TColor;
  }) {
    super();
    this.tool = tool;
    this.fillColor = fillColor;
    this.strokeColor = strokeColor;
    this.composition = this.getComposition();
    this.opacity = this.getOpacity();
  }

  getPressure(event, isStylus = false): number {
    if (this.tool === CanvasTool.PEN) {
      return isStylus ? event.touches[0]["force"] : 1;
    }

    return 0.5;
  }

  getComposition() {
    if (this.tool === CanvasTool.ERASER || this.tool === CanvasTool.CLEAR_ALL) {
      return "destination-out";
    }

    if (this.tool === CanvasTool.MARKER) {
      return "hard-light";
    }

    if (this.tool === CanvasTool.HIGHLIGHTER) {
      return "hue";
    }

    return "source-over";
  }

  getOpacity(): number {
    if (this.tool === CanvasTool.MARKER) {
      return 0.9;
    }

    if (this.tool === CanvasTool.HIGHLIGHTER) {
      return 0.75;
    }

    return 1;
  }

  calculateDimensions() {
    let xPoints, yPoints;
    if (CANVAS_LINE_TOOLS.includes(this.tool)) {
      xPoints = this.smoothPoints.path.map((point: number[]) => point[0]);
      yPoints = this.smoothPoints.path.map((point: number[]) => point[1]);
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

    if (CANVAS_LINE_TOOLS.includes(this.tool) && !isTransparent(this.strokeColor)) {
      const outerXPoints = this.smoothPoints.stroke.map((point: number[]) => point[0]);
      const outerYPoints = this.smoothPoints.stroke.map((point: number[]) => point[1]);
      outerMinX = Math.min(...outerXPoints);
      outerMinY = Math.min(...outerYPoints);
      outerMaxX = Math.max(...outerXPoints);
      outerMaxY = Math.max(...outerYPoints);
    } else if (this.tool === CanvasTool.LINE && this.size !== null) {
      const strokeSize = !isTransparent(this.strokeColor) ? this.size * 0.75 : this.size / 2;
      outerMinX -= strokeSize;
      outerMinY -= strokeSize;
      outerMaxX += strokeSize;
      outerMaxY += strokeSize;
    } else {
      let strokeSize = 0;
      if (
        this.size !== null &&
        (!isTransparent(this.strokeColor) ||
          this.tool === CanvasTool.BLOB ||
          this.tool === CanvasTool.ERASER)
      ) {
        strokeSize = this.size / 2;
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

    const toolOptions = this.toolOptions as unknown as ILineElementOptions;

    if (
      toolOptions.lineEndStyle === LineEndStyle.NONE ||
      toolOptions.lineEndSide === LineEndSide.NONE
    ) {
      return [
        { x: fromx, y: fromy },
        { x: toPos.x, y: toPos.y },
      ];
    } else if (toolOptions.lineEndStyle === LineEndStyle.ARROW && this.size !== null) {
      const headlen = this.size * 2; // length of head in pixels
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
      if (toolOptions.lineEndSide === LineEndSide.BOTH) {
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
      this.size !== null &&
      (toolOptions.lineEndStyle === LineEndStyle.SQUARE ||
        toolOptions.lineEndStyle === LineEndStyle.CIRCLE)
    ) {
      const headSize = this.size * 2;
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
      if (toolOptions.lineEndSide === LineEndSide.BOTH) {
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

  getSmoothPoints() {
    const stroke = getStroke(this.points, {
      ...this.freehandOptions,
      size: this.freehandOptions.size * 1.5,
      thinning: this.freehandOptions.thinning / 1.5,
    });
    const path = getStroke(this.points, this.freehandOptions);

    return {
      stroke,
      path,
    };
  }

  getSvgPathFromStroke(stroke: number[][]) {
    if (!stroke.length) return "";

    const d = stroke.reduce(
      (acc, [x0, y0], i, arr) => {
        const [x1, y1] = arr[(i + 1) % arr.length];
        acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
        return acc;
      },
      ["M", ...stroke[0], "Q"]
    );

    d.push("Z");
    return d.join(" ");
  }

  cacheElement() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (ctx === null) {
      return;
    }

    const dpi = window.devicePixelRatio;

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

    this.isDrawingCached = true;
    this.cache.drawing = {
      x: minX,
      y: minY,
      width,
      height,
      dpi,
      canvas,
    };
  }

  drawElement(canvas: HTMLCanvasElement, isCaching = false, debugMode = false) {
    if (
      this.isHTMLElement ||
      this.isDeleted ||
      this.dimensions.outerWidth === 0 ||
      this.dimensions.outerHeight === 0
    ) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (ctx === null) {
      return;
    }

    if (this.isDrawingCached) {
      const cachedCanvas = this.cache.drawing.canvas;
      const dpi = this.cache.drawing.dpi;
      ctx.save();
      ctx.globalCompositeOperation = this.composition as GlobalCompositeOperation;
      ctx.translate(this.cache.drawing.x, this.cache.drawing.y);
      ctx.drawImage(cachedCanvas, 0, 0, cachedCanvas.width / dpi, cachedCanvas.height / dpi);
      ctx.restore();

      if (debugMode) {
        ctx.save();
        ctx.beginPath();
        ctx.translate(this.cache.drawing.x, this.cache.drawing.y);
        ctx.rect(0, 0, cachedCanvas.width / dpi, cachedCanvas.height / dpi);
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
      (this.tool === CanvasTool.ERASER ||
        this.tool === CanvasTool.CUT ||
        this.tool === CanvasTool.CLEAR_ALL)
    ) {
      ctx.globalCompositeOperation = "source-over";
    } else {
      ctx.globalCompositeOperation = this.composition as GlobalCompositeOperation;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (this.size !== null) {
      ctx.lineWidth = this.size;
    }

    if (Array.isArray(this.strokeColor)) {
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
      for (let j = 0; j < this.strokeColor.length; j += 1) {
        const colorStop = this.strokeColor[j];
        const stop = colorStop.percent / 100;
        const color = formatColor(colorStop.color, this.opacity);
        gradient.addColorStop(stop, color);
      }
      ctx.strokeStyle = gradient;
    } else {
      ctx.strokeStyle = formatColor(this.strokeColor, this.opacity);
    }

    if (Array.isArray(this.fillColor)) {
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
      for (let j = 0; j < this.fillColor.length; j += 1) {
        const colorStop = this.fillColor[j];
        const stop = colorStop.percent / 100;
        const color = formatColor(colorStop.color, this.opacity);
        gradient.addColorStop(stop, color);
      }
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = formatColor(this.fillColor, this.opacity);
    }

    if (CANVAS_LINE_TOOLS.includes(this.tool)) {
      ctx.save();
      ctx.beginPath();
      const strokePoints = this.smoothPoints.stroke;
      ctx.moveTo(strokePoints[0][0], strokePoints[0][1]);
      const strokeData = this.getSvgPathFromStroke(strokePoints);
      const myStroke = new Path2D(strokeData);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill(myStroke);
      ctx.restore();

      ctx.save();
      if (isTransparent(this.fillColor)) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "#fff";
      }
      ctx.beginPath();
      const pathPoints = this.smoothPoints.path;
      ctx.moveTo(pathPoints[0][0], pathPoints[0][1]);
      const pathData = this.getSvgPathFromStroke(pathPoints);
      const myPath = new Path2D(pathData);
      ctx.fill(myPath);
      ctx.restore();
    } else if (this.tool === CanvasTool.CIRCLE) {
      ctx.beginPath();
      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;
      const radX = Math.abs(midX - minX);
      const radY = Math.abs(midY - minY);

      ctx.ellipse(midX, midY, radX, radY, 0, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fill();
    } else if (this.tool === CanvasTool.TRIANGLE) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.lineTo(points[2].x, points[2].y);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    } else if (this.tool === CanvasTool.RECTANGLE) {
      ctx.beginPath();
      const rectangle = new Path2D();
      const width = maxX - minX;
      const height = maxY - minY;
      rectangle.rect(minX, minY, width, height);
      ctx.stroke(rectangle);
      ctx.fill(rectangle);
    } else if (this.tool === CanvasTool.LINE) {
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

      if (this.toolOptions.lineEndStyle === LineEndStyle.ARROW) {
        ctx.beginPath();
        for (let i = points.length - 2; i > 0; i -= 1) {
          const targetPoint = numPoints > 4 && i <= 2 ? points[0] : points[numPoints - 1];
          ctx.moveTo(targetPoint.x, targetPoint.y);
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
      } else if (this.toolOptions.lineEndStyle === LineEndStyle.SQUARE && this.size !== null) {
        ctx.lineWidth = this.size / 2;
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
      } else if (this.toolOptions.lineEndStyle === LineEndStyle.CIRCLE && this.size !== null) {
        ctx.lineWidth = this.size / 2;
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

      if (this.toolOptions.lineEndStyle === LineEndStyle.ARROW) {
        ctx.beginPath();
        for (let i = points.length - 2; i > 0; i -= 1) {
          const targetPoint = numPoints > 4 && i <= 2 ? points[0] : points[numPoints - 1];
          ctx.moveTo(targetPoint.x, targetPoint.y);
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
      } else if (this.toolOptions.lineEndStyle === LineEndStyle.SQUARE) {
        ctx.beginPath();
        for (let i = 1; i < points.length - 1; i += 2) {
          const startPoint = points[i];
          const endPoint = points[i + 1];
          const width = endPoint.x - startPoint.x;
          const height = endPoint.y - startPoint.y;
          ctx.rect(startPoint.x, startPoint.y, width, height);
        }
        ctx.fill();
      } else if (this.toolOptions.lineEndStyle === LineEndStyle.CIRCLE) {
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
    } else if (this.tool === CanvasTool.BLOB || this.tool === CanvasTool.ERASER) {
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

      if (this.tool === CanvasTool.BLOB) {
        ctx.closePath();
        ctx.save();
        if (isTransparent(this.strokeColor)) {
          ctx.strokeStyle = ctx.fillStyle;
        }
        ctx.stroke();
        ctx.fill();
        ctx.restore();
      } else if (this.tool === CanvasTool.ERASER) {
        ctx.save();
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        ctx.restore();
      }
    } else if (this.tool === CanvasTool.CUT) {
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

      if (this.isCompletedCut) {
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
    } else if (this.tool === CanvasTool.CLEAR_ALL) {
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
