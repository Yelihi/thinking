/**
 * @description Blob 을 ArrayBuffer 로 인코딩합니다.
 * @param blob Blob
 * @returns ArrayBuffer
 */
export const encodeBlobToArrayBuffer = async (blob: Blob): Promise<ArrayBuffer> => {
  return await blob.arrayBuffer()
}
