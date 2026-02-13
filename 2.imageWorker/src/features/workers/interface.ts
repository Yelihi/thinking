export interface WorkerRequest {
  id: string
  file: File
  maxDim: number
  quality: number
}

export interface WorkerSuccess {
  id: string
  ok: true
  blob: Blob
  width: number
  height: number
  ms: number
}

export interface WorkerError {
  id: string
  ok: false
  error: string
}

export type WorkerResponse = WorkerSuccess | WorkerError

export interface ProcessResult {
  processedBlob: Blob
  previewUrl: string
  meta: {
    width: number
    height: number
    ms: number
    used: 'worker' | 'main'
  }
}
