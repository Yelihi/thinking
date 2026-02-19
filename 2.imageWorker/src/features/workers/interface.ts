export interface WorkerRequest {
  id: string
  file: File
  maxDim: number
  quality: number
  fileBuffer: ArrayBuffer
}

export interface WorkerSuccess {
  id: string
  ok: true
  blob: Blob
  outBuffer: ArrayBuffer
  width: number
  height: number
  ms: number
}

export interface WorkerError {
  id: string
  ok: false
  error: string
  ms: number
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

export type ItemStatus = 'queued' | 'processing' | 'done' | 'failed'

export interface ResizeItem {
  id: string
  fileName: string
  originalSize: number
  status: ItemStatus
  error?: string
  result?: {
    previewUrl: string
    processedSize: number
    width: number
    height: number
    ms: number
    used: string
  }
}
