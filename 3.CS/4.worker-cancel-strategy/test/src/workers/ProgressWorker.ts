import type { IWorkerState, JobConfig, YieldFn, FromWorker } from "./types";


export class ProgressWorker {
    state: IWorkerState


    constructor() {
        this.state = {
            items: null,
            latestRequestId: 0,
            canceled: new Set<number>()
        }
    }

    setLatest = (requestId: number) => {
        this.state.latestRequestId = requestId
    }

    setItems = (items: string[]) => {
        this.state.items = items
    }

    markCanceled = (requestId: number) => {
        this.state.canceled.add(requestId)
    }

    isLatest = (requestId: number) => {
        return this.state.latestRequestId === requestId
    }

    isCanceled = (requestId: number) => {
        return this.state.canceled.has(requestId)
    }

    runFilterJob = async (params: {
        requestId: number;
        query: string;
        yieldNext: YieldFn;
        post: (msg: FromWorker, transfer?: Transferable[]) => void;
        config: JobConfig;
    }) => {
        const { requestId, query, yieldNext, post, config } = params
        const items = this.state.items;

        if (!items) {
            post({ type: "ERROR", message: "items is not initialized" })
            return;
        }

        const q = query.toLocaleLowerCase();
        const totalItems = items.length;

        const indices: number[] = []

        let processed = 0;
        // CPU 부하용 변수 (dead-code 제거 방지)
        let cpu = 0;
        let chunkCount = 0;

        while (processed < totalItems) {
            if (!this.isLatest(requestId)) {
                return;
            }

            if (this.isCanceled(requestId)) {
                post({ type: "CANCELED", requestId });
                return;
            }

            const end = Math.min(processed + config.chunkIterations, totalItems)

            for (let i = processed; i < end; i++) {
                if (items[i].toLocaleLowerCase().includes(q)) {
                    indices.push(i)
                }
                if (config.maxResults && indices.length >= config.maxResults) {
                    processed = totalItems; // 전체 종료처럼 처리
                    break;
                }

                // CPU 부하(선택): “계산이 무거운 상황” 재현
                // totalIterations는 chunk마다 나눠서 조금씩 돌림
                if (config.totalIterations > 0) {
                    for (let j = 0; j < config.totalIterations; j++) {
                        cpu += (j % 10);
                    }

                }
            }

            processed = end;
            chunkCount++;

            // progress는 너무 자주 보내면 메인 렌더가 오히려 흔들릴 수 있음
            if (chunkCount % config.progressEveryChunks === 0) {
                post({ type: "PROGRESS", requestId, done: processed, total: totalItems });
            }

            // ✅ yield: 다음 tick으로 양보 → 메시지 처리(START/CANCEL) 기회 확보
            await yieldNext();
        }

        // 결과 전송 (indices는 TypedArray로 transfer)
        console.log(cpu)
        const typed = new Uint32Array(indices);
        post({ type: "RESULT", requestId, indices: typed }, [typed.buffer]);


    }


}