export interface FileInformationProps {
  name: string
  type: string
  size: number
}

export const FileInformation = ({ name, type, size }: FileInformationProps) => {
  return (
    <div className="mt-4 text-sm leading-6">
      <span className="font-bold">File: {name}</span>
      <span className="font-bold">Type: {type}</span>
      <span className="font-bold">Size: {(size / 1024 / 1024).toFixed(2)} MB</span>
    </div>
  )
}
