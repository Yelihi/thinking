/**
 * Worker 스레드에서 이미지를 처리합니다.
 *
 * 1. request 를 받아, 비트맵으로 전환합니다
 * 2. 사이즈를 조정합니다
 * 3. DOM 과 분리된 canvas 내 조정된 이미지를 그립니다.
 * 4. 해당 canvas 내 blob 변경 메서드를 통해 blob 을 생성합니다.
 * 5. blob 을 메인 스레드로 전송합니다. (참고로 blob 이 worker 환경에서 이미지 데이터를 다루는 유일한 방법입니다. DOM 이 없기 때문)
 */

import { fitMaxDimension } from '../../utils/imageMath'

// interface
import type { WorkerRequest, WorkerSuccess, WorkerError } from './interface'

// Worker에서 createImageBitmap 사용 가능
// 참고로 createImageBitmap 은 이미지를 미리 비동기로 비트맵으로 변환해 준 다음, canvas 에서 언제든지 재사용하여 drawImage 할 시 디코딩 과정을 생략하게 합니다

// 인코딩은 OffscreenCanvas + convertToBlob() 또는 canvas.toBlob() 경로를 사용

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const req = e.data
  const t0 = performance.now() // 시작 시간 기록

  try {
    const bmp = await createImageBitmap(req.file) // 이미지를 비트맵으로 변환
    // 이미지의 가로/세로 비율을 유지하면서, 최대 크기(maxDim)이내로 축소하는 함수
    const { width, height } = fitMaxDimension(bmp.width, bmp.height, req.maxDim)

    // OffscreenCanvas (Worker에서 사용 가능 환경이 많음)
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('2d context not available (worker)')

    ctx.drawImage(bmp, 0, 0, width, height)

    // OffscreenCanvas에는 convertToBlob이 있음(지원 환경에서) - 미지원이면 아래 fallback에서 처리
    let blob: Blob
    const anyCanvas: OffscreenCanvas = canvas as OffscreenCanvas
    if (typeof anyCanvas.convertToBlob === 'function') {
      blob = await anyCanvas.convertToBlob({ type: 'image/jpeg', quality: req.quality })
    } else {
      /**
       * 이 부분이 햇갈릴 수 있는데
       * error 를 throw 했다고 메인 스레드의 catch 에 잡히지 않습니다. 실행 컨택스트 자체가 다르기 때문
       * 해당 error 는 worker 스레드 내에서 처리되며, 현 catch 에서 잡힙니다
       * catch 내에서의 메시지로 ok : false 를 보내기 때문에 이를 파악하여 메인 스레드에서는 fallback 처리 합니다.
       */
      throw new Error('OffscreenCanvas.convertToBlob not supported')
    }

    const t1 = performance.now()
    const res: WorkerSuccess = { id: req.id, ok: true, blob, width, height, ms: t1 - t0 }
    self.postMessage(res)
  } catch (err: unknown) {
    const res: WorkerError = {
      id: req.id,
      ok: false,
      error: (err as Error)?.message ?? 'Worker 에서 오류가 발생했습니다.',
    }
    self.postMessage(res)
  }
}
