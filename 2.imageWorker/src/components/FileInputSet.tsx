import type { ChangeEvent } from 'react'

export interface FileInputProps {
  onFilesChange: (files: File[]) => void
}

export const FileInputSet = ({ onFilesChange }: FileInputProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    onFilesChange(files)
  }

  return (
    <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-md border border-gray-200 p-10">
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      <p className="text-sm text-center text-black">
        이미지를 업로드해주세요
        <br />
        (여러 파일을 한 번에 선택할 수 있어요)
      </p>
    </label>
  )
}
