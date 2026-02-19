import type { ResizeItem } from '../features/workers/interface'

import { BaseButton } from './BaseButton'
import { ImageSkeleton } from './ImageSkeleton'

export interface ImageResizeProcessListProps {
  items: ResizeItem[]
  onRemove: (itemId: string) => void
}

const statusLabel: Record<ResizeItem['status'], string> = {
  queued: '대기 중',
  processing: '처리 중',
  done: '완료',
  failed: '실패',
}

const statusClassName: Record<ResizeItem['status'], string> = {
  queued: 'bg-amber-50 text-amber-700',
  processing: 'bg-blue-50 text-blue-700',
  done: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-red-50 text-red-700',
}

const formatSize = (size: number) => `${(size / 1024 / 1024).toFixed(2)} MB`

export const ImageResizeProcessList = ({ items, onRemove }: ImageResizeProcessListProps) => {
  if (!items.length) {
    return (
      <p className="text-sm text-gray-500">큐에 추가된 이미지가 없습니다. 이미지를 선택해주세요.</p>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {items.map((item) => (
        <article key={item.id} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="m-0 text-sm font-semibold text-gray-900">{item.fileName}</p>
              <p className="m-0 text-xs text-gray-500">원본 크기 {formatSize(item.originalSize)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassName[item.status]}`}
              >
                {statusLabel[item.status]}
              </span>
              <BaseButton
                type="button"
                onClick={() => onRemove(item.id)}
                disabled={item.status === 'processing'}
              >
                삭제
              </BaseButton>
            </div>
          </header>

          {item.status === 'processing' && <ImageSkeleton />}

          {item.status === 'queued' && (
            <p className="m-0 text-sm text-gray-500">처리 대기 중입니다. "처리 시작"을 눌러주세요.</p>
          )}

          {item.status === 'failed' && item.error && (
            <p className="m-0 text-sm text-red-600">에러: {item.error}</p>
          )}

          {item.status === 'done' && item.result && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <img
                src={item.result.previewUrl}
                alt={`${item.fileName} preview`}
                className="h-36 w-36 rounded-md border border-gray-100 object-cover"
              />
              <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <dt className="text-gray-500">사용 경로</dt>
                  <dd className="font-semibold text-gray-900">{item.result.used}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">처리 크기</dt>
                  <dd className="font-semibold text-gray-900">{formatSize(item.result.processedSize)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">사이즈</dt>
                  <dd className="font-semibold text-gray-900">
                    {item.result.width}×{item.result.height}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">소요 시간</dt>
                  <dd className="font-semibold text-gray-900">{item.result.ms.toFixed(1)} ms</dd>
                </div>
                <div>
                  <dt className="text-gray-500">압축률</dt>
                  <dd className="font-semibold text-gray-900">
                    {((item.result.processedSize / item.originalSize) * 100).toFixed(1)}%
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </article>
      ))}
    </div>
  )
}
