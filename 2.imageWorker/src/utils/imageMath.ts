/**
 * @description 이미지의 가로/세로 비율을 유지하면서, 최대 크기(maxDim)이내로 축소하는 함수
 * @param w 이미지의 가로 크기
 * @param h 이미지의 세로 크기
 * @param maxDim 최대 크기
 * @returns 조정된 이미지의 가로/세로 크기
 */
export const fitMaxDimension = (w: number, h: number, maxDim: number) => {
  if (maxDim <= 0) throw new Error('최대크기는 0보다 커야합니다 > 0')
  if (w <= maxDim && h <= maxDim) return { width: w, height: h } // 최대 크기보다 작으면 그대로 반환

  // 이제부터는 최대 설정 크기보다 w, h가 클 때
  const scale = maxDim / Math.max(w, h) // 최대 크기로 나누어 조정
  return { width: Math.round(w * scale), height: Math.round(h * scale) } // 소수점 버림
}
