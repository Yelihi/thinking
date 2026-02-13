import { useState } from 'react'

import { processImage } from '../processImage'

export interface ImageResizeResult {
  previewUrl: string
  originalSize: number
  processedSize: number
  width: number
  height: number
  ms: number
  used: 'worker' | 'main'
}

export const useImageResize = () => {
  const [resizeProcessStatus, setResizeProcessStatus] = useState<'idle' | 'processing' | 'error'>(
    'idle',
  )
  const [resizeProcessError, setResizeProcessError] = useState<string>('')
  const [resizeResult, setResizeResult] = useState<ImageResizeResult | null>(null)

  const onResize = async (file: File, maxDim: number, quality: number) => {
    if (!file) return

    setResizeProcessStatus('processing')
    setResizeProcessError('')

    try {
      const resultFile = await processImage(file, { maxDim, quality })

      setResizeResult((prev) => {
        if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl)

        return {
          previewUrl: resultFile.previewUrl,
          originalSize: file.size,
          processedSize: resultFile.processedBlob.size,
          width: resultFile.meta.width,
          height: resultFile.meta.height,
          ms: resultFile.meta.ms,
          used: resultFile.meta.used,
        }
      })

      setResizeProcessStatus('idle')
    } catch (error: unknown) {
      setResizeProcessStatus('error')
      setResizeProcessError((error as Error)?.message ?? 'processing failed')
    }
  }

  const resultReset = () => {
    if (resizeResult?.previewUrl) URL.revokeObjectURL(resizeResult.previewUrl)
    setResizeResult(null)
    setResizeProcessStatus('idle')
    setResizeProcessError('')
  }

  return {
    resizeProcessStatus,
    resizeProcessError,
    resizeResult,
    onResize,
    resultReset,
  }
}
