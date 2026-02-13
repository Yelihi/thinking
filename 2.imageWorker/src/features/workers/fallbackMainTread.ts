import { fitMaxDimension } from '../../utils/imageMath'

export const compressOnMainThread = async (file: File, maxDim: number, quality: number) => {
  const bmp = await createImageBitmap(file) // 브라우저 전역 api 이며 worker 에서도 사용 가능
  const { width, height } = fitMaxDimension(bmp.width, bmp.height, maxDim)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context not available')

  ctx.drawImage(bmp, 0, 0, width, height)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))),
      'image/jpeg',
      quality,
    )
  })

  return { blob, width, height }
}
