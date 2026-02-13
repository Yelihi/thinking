import type { ImageResizeResult } from '../features/hooks/useImageResize'

import { BaseButton } from './BaseButton'

export interface ImageResizeProcessProps {
  file: File | null
  resizeProcessStatus: 'idle' | 'processing' | 'error'
  resizeProcessError: string
  resizeResult: ImageResizeResult | null
  onResizeClick: () => void
}

export const ImageResizeProcess = ({
  file,
  resizeProcessStatus,
  resizeProcessError,
  resizeResult,
  onResizeClick,
}: ImageResizeProcessProps) => {
  return (
    <section className="flex w-full flex-col items-center justify-center gap-3">
      <div className="mt-6 flex items-center gap-4">
        <BaseButton
          disabled={!file || resizeProcessStatus === 'processing'}
          onClick={onResizeClick}
        >
          {resizeProcessStatus === 'processing' ? 'Processing...' : 'Process'}
        </BaseButton>
        {resizeProcessError && (
          <span className="text-sm font-bold text-red-500">{resizeProcessError}</span>
        )}
      </div>

      {resizeResult && (
        <div className="mt-6 flex items-start gap-4">
          <img
            src={resizeResult.previewUrl}
            alt="processed preview"
            style={{
              width: 240,
              height: 240,
              objectFit: 'cover',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
            }}
          />
          <div className="text-sm leading-6">
            <div>
              <b>Used</b>: {resizeResult.used}
            </div>
            <div>
              <b>Processed</b>: {(resizeResult.processedSize / 1024 / 1024).toFixed(2)} MB
            </div>
            <div>
              <b>Dim</b>: {resizeResult.width}×{resizeResult.height}
            </div>
            <div>
              <b>Time</b>: {resizeResult.ms.toFixed(1)} ms
            </div>
            <div>
              <b>Ratio</b>:{' '}
              {((resizeResult.processedSize / resizeResult.originalSize) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
