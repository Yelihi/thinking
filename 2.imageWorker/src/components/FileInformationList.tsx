export interface FileInformationListProps {
  files: Array<{ name: string; type: string; size: number }>
}

export const FileInformationList = ({ files }: FileInformationListProps) => {
  if (!files.length) return null

  return (
    <div className="mt-4 w-full">
      <p className="mb-2 text-sm font-medium text-gray-500">선택된 파일 목록</p>
      <ul className="flex flex-col gap-2 rounded-md border border-gray-200 p-4 text-sm leading-6">
        {files.map((file) => (
          <li
            key={`${file.name}-${file.size}-${file.type}`}
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <span className="font-semibold text-gray-900">{file.name}</span>
            <span className="text-gray-500">{file.type || 'unknown'}</span>
            <span className="text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
