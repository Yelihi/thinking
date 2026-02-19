import { useCallback, useEffect, useMemo, useState } from 'react'
import { observeLongTasks, type LongTaskSample } from '../utils/observeLongTask'

// hooks
import { useImageResizeQueue } from '../features/hooks/useImageResizeQueue'

// components
import { BaseButton } from '../components/BaseButton'
import { FileInputSet } from '../components/FileInputSet'
import { FileInformationList } from '../components/FileInformationList'
import { ImageResizeProcessList } from '../components/ImageResizeProcessList'
import { LongTaskList } from '../components/LongTaskList'

export function ImagePrepPanel() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [longTasks, setLongTasks] = useState<LongTaskSample[]>([])

  const { items, enqueueFiles, start, removeItem, resetAll } = useImageResizeQueue()

  useEffect(() => {
    const stop = observeLongTasks((s) => setLongTasks((prev) => [s, ...prev].slice(0, 20)))
    return () => stop()
  }, [])

  const fileInfos = useMemo(
    () => selectedFiles.map((file) => ({ name: file.name, type: file.type, size: file.size })),
    [selectedFiles],
  )

  const statusStats = useMemo(() => {
    return items.reduce<Record<'queued' | 'processing' | 'done' | 'failed', number>>(
      (acc, item) => {
        acc[item.status] += 1
        return acc
      },
      { queued: 0, processing: 0, done: 0, failed: 0 },
    )
  }, [items])

  const handleFilesChange = useCallback(
    (files: File[]) => {
      setSelectedFiles(files)
      if (files.length) {
        enqueueFiles(files)
      }
    },
    [enqueueFiles],
  )

  const handleStart = useCallback(() => {
    start({ maxDim: 1600, quality: 0.85 }, 2)
  }, [start])

  const handleReset = useCallback(() => {
    setSelectedFiles([])
    resetAll()
    setLongTasks([])
  }, [resetAll])

  const hasQueuedItems = useMemo(() => items.some((item) => item.status === 'queued'), [items])

  return (
    <section className="font-system-ui mx-auto my-12 flex max-w-860 flex-col items-center justify-center gap-4">
      <div className="flex flex-col items-center justify-center gap-4">
        <h2 className="my-0">Session 1 — Image preprocess (Worker-first)</h2>
        <BaseButton onClick={handleReset}>Reset</BaseButton>
      </div>

      <FileInputSet onFilesChange={handleFilesChange} />

      <FileInformationList files={fileInfos} />

      <div className="flex w-full flex-col gap-3 rounded-lg border border-gray-100 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-base font-semibold text-gray-900">처리 제어</p>
          <BaseButton onClick={handleStart} disabled={!hasQueuedItems}>
            처리 시작
          </BaseButton>
        </div>
        <div className="grid w-full grid-cols-2 gap-3 text-center sm:grid-cols-4">
          <div className="rounded-md bg-gray-50 p-3">
            <p className="m-0 text-xs text-gray-500">대기</p>
            <p className="m-0 text-xl font-semibold text-gray-900">{statusStats.queued}</p>
          </div>
          <div className="rounded-md bg-gray-50 p-3">
            <p className="m-0 text-xs text-gray-500">처리 중</p>
            <p className="m-0 text-xl font-semibold text-gray-900">{statusStats.processing}</p>
          </div>
          <div className="rounded-md bg-gray-50 p-3">
            <p className="m-0 text-xs text-gray-500">완료</p>
            <p className="m-0 text-xl font-semibold text-gray-900">{statusStats.done}</p>
          </div>
          <div className="rounded-md bg-gray-50 p-3">
            <p className="m-0 text-xs text-gray-500">실패</p>
            <p className="m-0 text-xl font-semibold text-gray-900">{statusStats.failed}</p>
          </div>
        </div>
      </div>

      <ImageResizeProcessList items={items} onRemove={removeItem} />

      <LongTaskList longTasks={longTasks} />
    </section>
  )
}
