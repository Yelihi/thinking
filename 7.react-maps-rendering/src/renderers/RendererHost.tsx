import type { RendererHostProps } from "../benchmark/types";
import { CanvasRendererPlaceholder } from "./canvas/CanvasRendererPlaceholder";
import { DomRendererPlaceholder } from "./dom/DomRendererPlaceholder";
import { WebGLRendererPlaceholder } from "./webgl/WebGLRendererPlaceholder";

export function RendererHost({ controls, viewport }: RendererHostProps) {
  const rendererProps = { controls, viewport };

  if (controls.rendererMode === "canvas") {
    return <CanvasRendererPlaceholder {...rendererProps} />;
  }

  if (controls.rendererMode === "webgl") {
    return <WebGLRendererPlaceholder {...rendererProps} />;
  }

  return <DomRendererPlaceholder {...rendererProps} />;
}
