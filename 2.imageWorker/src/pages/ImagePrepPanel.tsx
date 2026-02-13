import { useCallback, useEffect, useMemo, useState } from 'react'
import { observeLongTasks, type LongTaskSample } from '../utils/observeLongTask'

// hooks
import { useImageResize } from '../features/hooks/useImageResize'

// components
import { BaseButton } from '../components/BaseButton'
import { FileInputSet } from '../components/FileInputSet'
import { FileInformation } from '../components/FileInformation'
import { ImageResizeProcess } from '../components/ImageResizeProcess'
import { LongTaskList } from '../components/LongTaskList'

export function ImagePrepPanel() {
  const [file, setFile] = useState<File | null>(null)
  const [longTasks, setLongTasks] = useState<LongTaskSample[]>([])

  const { resizeProcessStatus, resizeProcessError, resizeResult, onResize, resultReset } =
    useImageResize()

  useEffect(() => {
    const stop = observeLongTasks((s) => setLongTasks((prev) => [s, ...prev].slice(0, 20)))
    return () => stop()
  }, [])

  const originalInfo = useMemo(() => {
    if (!file) return null
    return { name: file.name, size: file.size, type: file.type }
  }, [file])

  const handleResize = useCallback(() => {
    if (file) onResize(file, 1600, 0.85)
  }, [file, onResize])

  const handleReset = useCallback(() => {
    setFile(null)
    resultReset()
    setLongTasks([])
  }, [resultReset])

  return (
    <section className="font-system-ui mx-auto my-12 max-w-860">
      <div className="flex items-center justify-between">
        <h2 className="my-0">Session 1 — Image preprocess (Worker-first)</h2>
        <BaseButton onClick={handleReset}>Reset</BaseButton>
      </div>

      <FileInputSet onFileChange={setFile} />

      {originalInfo && (
        <FileInformation
          name={originalInfo.name}
          type={originalInfo.type}
          size={originalInfo.size}
        />
      )}

      <ImageResizeProcess
        file={file}
        resizeProcessStatus={resizeProcessStatus}
        resizeProcessError={resizeProcessError}
        resizeResult={resizeResult}
        onResizeClick={handleResize}
      />

      <LongTaskList longTasks={longTasks} />
    </section>
  )
}
