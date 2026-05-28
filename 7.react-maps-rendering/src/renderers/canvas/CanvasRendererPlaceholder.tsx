import type { RendererHostProps } from "../../benchmark/types";

export function CanvasRendererPlaceholder({ controls }: RendererHostProps) {
  return (
    <section className="map-surface" aria-label="Canvas renderer placeholder">
      <canvas aria-hidden="true" className="overlay-canvas" />
      <div className="renderer-card">
        <p className="eyebrow">Canvas Overlay</p>
        <h2>{controls.distribution} distribution</h2>
        <p>Canvas draw loop 구현 전 placeholder입니다.</p>
      </div>
    </section>
  );
}
