export interface FileInputProps {
  onFileChange: (file: File | null) => void
}

export const FileInputSet = ({ onFileChange }: FileInputProps) => {
  return (
    <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-md border border-gray-200 p-10">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />
      <p className="text-sm text-black">이미지를 업로드해주세요</p>
    </label>
  )
}
