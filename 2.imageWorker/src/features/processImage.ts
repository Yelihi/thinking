import { createImageWorkerClient } from './workers/workerClient'
import { compressOnMainThread } from './workers/fallbackMainTread'

import type { WorkerSuccess, ProcessResult } from './workers/interface'

// image worker 를 생성합시다.
const client = createImageWorkerClient()

/**
 * @description 이미지의 크기를 조정합니다. 단, worker 내에서 잘 처리되지못한다면 main thread 로 넘어갑니다.
 * @param file 이미지 파일
 * @param { maxDim: number, quality: number } opts 옵션
 * @returns { ProcessResult } 처리된 이미지 결과
 */
export const processImage = async (
  file: File,
  opts?: { maxDim?: number; quality?: number },
): Promise<ProcessResult> => {
  if (!file.type.startsWith('image/')) throw new Error('이미지 파일만 지원합니다')

  const maxDim = opts?.maxDim ?? 1600
  const quality = opts?.quality ?? 0.85

  // worker 스레드 환경을 구축합니다.
  const id = crypto.randomUUID()
  const res = await client.run({ id, file, maxDim, quality })

  let blob: Blob
  let width: number
  let height: number
  let ms: number
  let used: 'worker' | 'main'

  if (res.ok) {
    const ok = res as WorkerSuccess
    blob = ok.blob
    width = ok.width
    height = ok.height
    ms = ok.ms
    used = 'worker'
  } else {
    // 실패할 경우 main thread 로 넘어갑니다.
    const t0 = performance.now()
    const out = await compressOnMainThread(file, maxDim, quality)
    const t1 = performance.now()
    blob = out.blob
    width = out.width
    height = out.height
    ms = t1 - t0
    used = 'main'
  }

  // blob 을 이미지 url 로 변환
  const previewUrl = URL.createObjectURL(blob)

  // 처리된 이미지 결과를 반환합니다.
  return { processedBlob: blob, previewUrl, meta: { width, height, ms, used } }
}
