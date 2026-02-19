export const ImageSkeleton = () => {
  return (
    <div className="flex w-full items-start gap-4 rounded-md border border-gray-100 p-4">
      <div className="h-28 w-28 animate-pulse rounded-md bg-gray-200" />
      <div className="flex flex-1 flex-col gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
        ))}
      </div>
    </div>
  )
}
