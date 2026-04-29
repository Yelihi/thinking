/// <reference lib="webworker" />

import { ProgressWorker } from "./ProgressWorker";
import { createMessageChannelYield } from "./yield";

import type { FromWorker, ToWorker } from "./types";

const progressWorker = new ProgressWorker();
const yieldNextTick = createMessageChannelYield();

// 한 번에 한 job만 “의미 있게” 유지: latestRequestId로 stale 정리
// (이 구조는 "취소"가 아니라 "무효화" 기반 최신성 유지)
const JOB_CONFIG = {
    totalIterations: 10000,          // 여기서 CPU 부하를 더 주고 싶으면 >0로
    chunkIterations: 8192,       // 핵심 파라미터 (2M 데이터면 8192~65536 사이 실험)
    progressEveryChunks: 10,     // progress 빈도
    maxResults: undefined as number | undefined,
};

function post(msg: FromWorker, transfer?: Transferable[]) {
    if (transfer) self.postMessage(msg, transfer);
    else self.postMessage(msg);
}

/**
 * 해당 worker 로 main thread 내 message 전달받기
 */
self.onmessage = (e: MessageEvent<ToWorker>) => {
    const msg = e.data;

    if (msg.type === "INIT") {
        progressWorker.setItems(msg.list);
        post({ type: "READY", size: msg.list.length });
        return;
    }

    if (msg.type === "CANCEL") {
        progressWorker.markCanceled(msg.requestId);
        // 실제 중단 여부는 runFilterJob이 chunk 경계에서 판단하고 CANCELED를 보냄
        return;
    }

    if (msg.type === "START") {
        progressWorker.setLatest(msg.requestId);
        // 이전 요청은 최신성이 깨져서 자동 stale 종료됨
        progressWorker.runFilterJob({
            requestId: msg.requestId,
            query: msg.query,
            yieldNext: yieldNextTick,
            post,
            config: JOB_CONFIG,
        });
        return;
    }
}