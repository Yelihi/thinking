import type { RendererHostProps } from "../benchmark/types";
import { CanvasRendererPlaceholder } from "./canvas/CanvasRendererPlaceholder";
import { DomRendererPlaceholder } from "./dom/DomRendererPlaceholder";
import { WebGLRendererPlaceholder } from "./webgl/WebGLRendererPlaceholder";

export function RendererHost({ controls }: RendererHostProps) {
  if (controls.rendererMode === "canvas") {
    return <CanvasRendererPlaceholder controls={controls} />;
  }

  if (controls.rendererMode === "webgl") {
    return <WebGLRendererPlaceholder controls={controls} />;
  }

  return <DomRendererPlaceholder controls={controls} />;
}
