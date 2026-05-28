import type { RendererHostProps } from "../../benchmark/types";

export function WebGLRendererPlaceholder({ controls }: RendererHostProps) {
  return (
    <section className="map-surface" aria-label="WebGL renderer placeholder">
      <canvas aria-hidden="true" className="overlay-canvas" />
      <div className="renderer-card">
        <p className="eyebrow">WebGL Overlay</p>
        <h2>{controls.rendererMode.toUpperCase()}</h2>
        <p>buffer와 shader 구현 전 placeholder입니다.</p>
      </div>
    </section>
  );
}
