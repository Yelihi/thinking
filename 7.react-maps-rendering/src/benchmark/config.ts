import type { MarkerCountOption, RendererMode, MarkerDistribution, BenchmarkMetric } from "./types";

export const markerCounts: MarkerCountOption[] = [10000, 50000, 100000, 300000];

export const rendererModes: Array<{ mode: RendererMode; label: string }> = [
    { mode: "dom", label: "DOM Marker" },
    { mode: "canvas", label: "Canvas Overlay" },
    { mode: "webgl", label: "WebGL Overlay" },
];

export const distributions: Array<{ value: MarkerDistribution; label: string }> = [
    { value: "uniform", label: "Uniform" },
    { value: "clustered", label: "Clustered" },
    { value: "hotspot", label: "Hotspot" },
];

export const scaffoldMetrics: BenchmarkMetric[] = [
    { label: "Dataset", value: "수동 구현 대기", tone: "neutral" },
    { label: "Renderer", value: "placeholder", tone: "warning" },
    { label: "Frame Time", value: "측정 전", tone: "neutral" },
    { label: "FPS", value: "측정 전", tone: "neutral" },
];