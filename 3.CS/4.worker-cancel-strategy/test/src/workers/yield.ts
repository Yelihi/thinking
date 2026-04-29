import type { YieldFn } from "./types";

/**
 * Worker에서 "다음 tick"으로 양보하기 위한 MessageChannel 기반 yield.
 * - setTimeout(0)보다 예측 가능한 macrotask tick을 만들기 좋다.
 * - 실행 원래는 기존 작업을 macrotask 내에 위치시키고, 긴급하게 처리할 다른 작업을 워커스레드에 실행시킨다.
 * - 해당 작업은 메인스레드와는 별개
 */
export function createMessageChannelYield(): YieldFn {
    const channel = new MessageChannel();

    // 해당 resume 은 port2 에서 전달받을 resolve 함수를 받는다.
    let resume: (() => void) | null = null;

    channel.port1.onmessage = () => {
        const r = resume;
        resume = null;
        r?.(); // resolve 를 실행시켜 yieldNextTick 을 해제한다.
    };

    return function () {
        return new Promise<void>((resolve) => {
            resume = resolve; // 잠시 resolve 를 resume (clouser 활용) 에 등록해두면서, 속한 작업을 macrotask 내 이동시킨다.
            channel.port2.postMessage(null); // port1 으로 메시지를 전달
        });
    };
}