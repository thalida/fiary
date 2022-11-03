import { TRANSPARENT_COLOR } from "@/constants/core";
import type { IColor } from "@/types/core";

export function getColorAsCss(color: IColor): string {
  if (color === TRANSPARENT_COLOR) {
    return "transparent";
  }

  if (Array.isArray(color)) {
    const gradientStops = [];
    for (let i = 0; i < color.length; i += 1) {
      const colorStop = getColorAsCss(color[i].color);
      const percent = color[i].percent;
      gradientStops.push(`${colorStop} ${percent}%`);
    }

    return `linear-gradient(135deg, ${gradientStops.join(", ")})`;
  }

  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}
