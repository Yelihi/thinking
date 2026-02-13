/**
 * 메인 스레드                              Worker 스레드
    │                                        │
    ├─ run(req₁) → pending.set("1", resolve₁)│
    ├─ postMessage(req₁) ──────────────────► │ onmessage → 이미지₁ 처리 시작
    │  (await 상태, 하지만 메인스레드는 블로킹 X)│
    │                                        │
    ├─ run(req₂) → pending.set("2", resolve₂)│
    ├─ postMessage(req₂) ──────────────────► │ (큐에 대기)
    │                                        │
    │                                        │ 이미지₁ 처리 완료
    │  ◄──────────── postMessage(res₁) ──────┤
    │                                        │
    ├─ onmessage → pending.get("1")          │ 이미지₂ 처리 시작
    ├─ resolve₁(res₁) → Promise₁ 완료!       │
    ├─ pending.delete("1")                   │
    │                                        │
    │                                        │ 이미지₂ 처리 완료
    │  ◄──────────── postMessage(res₂) ──────┤
    │                                        │
    ├─ onmessage → pending.get("2")          │
    ├─ resolve₂(res₂) → Promise₂ 완료!       │
    ├─ pending.delete("2")                   │

    참고로 await 의 중요점이 있는데, await 는 메인 스레드를 블록킹 하지 않습니다.
    예시로

    async function handleClick() {
      console.log('A')
      const result = await client.run(req)  // ← 여기서 함수만 중단
      console.log('B')                       // ← resolve 되면 재개
    }

    handleClick()
    console.log('C')

    여기서 결과가 A, C, B 순서로 진행이 됩니다. 즉, await 는 .then() 의 문법적 설탕이기에
    말 그대로 함수만 중단하고 기다릴 뿐입니다.
  
 */

import type { WorkerRequest, WorkerResponse } from './interface'

export const createImageWorkerClient = () => {
  // ImageWorker 를 생성합니다.
  const worker = new Worker(new URL('./imageWorker.ts', import.meta.url), { type: 'module' })

  // 요청 ID 와 콜백 함수를 저장하는 맵을 생성합니다.
  const pending = new Map<string, (res: WorkerResponse) => void>()

  worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
    const response = e.data
    // 메인 스레드에서 요청 ID 를 가져와서 resolve 함수를 가져옵니다.
    const mainThreadResolve = pending.get(response.id)
    if (!mainThreadResolve) return
    pending.delete(response.id)
    mainThreadResolve(response)
  }

  return {
    async run(req: WorkerRequest): Promise<WorkerResponse> {
      return await new Promise((resolve) => {
        pending.set(req.id, resolve)
        worker.postMessage(req)
      })
    },
    terminate() {
      worker.terminate()
      pending.clear()
    },
  }
}
