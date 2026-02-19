import { useState, useRef, useMemo, useEffect, useCallback } from 'react'

import { createUrlStore } from '../models/urlStore'
import { processImage } from '../processImage'
import { createImageWorkerClient } from '../workers/workerClient'

import type { ResizeItem } from '../workers/interface'

type Task = { itemId: string; file: File }

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export const useImageResizeQueue = () => {
  const [items, setItems] = useState<ResizeItem[]>([])
  const queueRef = useRef<Task[]>([])
  const runningRef = useRef(0)
  const optsRef = useRef<{ maxDim: number; quality: number } | null>(null)
  const concurrencyRef = useRef<number>(2)

  const urlStore = useMemo(() => createUrlStore(), [])
  const createPreviewUrl = useCallback(
    (blob: Blob) => {
      const url = URL.createObjectURL(blob)
      urlStore.add(url)
      return url
    },
    [urlStore],
  )

  // worker 클라이언트 생성
  const workerClient = useMemo(() => createImageWorkerClient(), [])

  useEffect(() => {
    return () => {
      workerClient.terminate()
      urlStore.revokeAll()
    }
  }, [workerClient, urlStore])

  const enqueueFiles = (files: File[]) => {
    const newItems: ResizeItem[] = files.map((file) => ({
      id: makeId(),
      fileName: file.name,
      originalSize: file.size,
      status: 'queued',
    }))

    queueRef.current.push(...newItems.map((it, idx) => ({ itemId: it.id, file: files[idx] })))

    setItems((prev) => [...newItems, ...prev])
  }

  const runNext = async () => {
    const opts = optsRef.current
    const concurrency = concurrencyRef.current

    if (!opts) return

    while (runningRef.current < concurrency && queueRef.current.length > 0) {
      const task = queueRef.current.shift()
      runningRef.current += 1

      if (!task) {
        return
      }

      setItems((prev) => {
        return prev.map((it) => (it.id === task.itemId ? { ...it, status: 'processing' } : it))
      })

      processImage(task.file, opts, createPreviewUrl)
        .then((out) => {
          setItems((prev) =>
            prev.map((it) => {
              if (it.id !== task.itemId) return it

              // 기존 result가 있으면 해당 URL만 revoke
              if (it.result?.previewUrl) {
                urlStore.revoke(it.result.previewUrl)
              }

              return {
                ...it,
                status: 'done',
                result: {
                  previewUrl: out.previewUrl,
                  processedSize: out.processedBlob.size,
                  width: out.meta.width,
                  height: out.meta.height,
                  ms: out.meta.ms,
                  used: out.meta.used,
                },
              }
            }),
          )
        })
        .catch((err) => {
          setItems((prev) =>
            prev.map((it) =>
              it.id === task.itemId ? { ...it, status: 'failed', error: String(err) } : it,
            ),
          )
        })
        .finally(() => {
          runningRef.current -= 1
          void runNext()
        })
    }
  }

  const start = (opts: { maxDim: number; quality: number }, concurrency: number) => {
    optsRef.current = opts
    concurrencyRef.current = concurrency
    void runNext()
  }

  const removeItem = (itemId: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === itemId)

      if (target?.result?.previewUrl) {
        urlStore.revoke(target.result.previewUrl)
      }

      return prev.filter((it) => it.id !== itemId)
    })

    queueRef.current = queueRef.current.filter((t) => t.itemId !== itemId)
  }

  const resetAll = () => {
    setItems([])
    queueRef.current = []
    urlStore.revokeAll()
  }

  return { items, enqueueFiles, start, removeItem, resetAll }
}
