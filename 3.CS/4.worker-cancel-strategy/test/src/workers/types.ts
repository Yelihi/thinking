/// <reference lib="webworker" />

export type ToWorker =
    | { type: "INIT"; list: string[] }
    | { type: "START"; requestId: number; query: string }
    | { type: "CANCEL"; requestId: number };

export type FromWorker =
    | { type: "READY"; size: number }
    | { type: "PROGRESS"; requestId: number; done: number; total: number }
    | { type: "RESULT"; requestId: number; indices: Uint32Array }
    | { type: "CANCELED"; requestId: number }
    | { type: "ERROR"; requestId?: number; message: string };

export interface IWorkerState {
    items: string[] | null;
    latestRequestId: number;
    canceled: Set<number>;
}

export interface JobConfig {
    totalIterations: number;     // CPU 부하(데모용)
    chunkIterations: number;     // chunk 크기
    progressEveryChunks: number; // progress 메시지 빈도 제어
    maxResults?: number;         // (선택) Top-N로 제한하고 싶으면 사용
}

export type YieldFn = () => Promise<void>;