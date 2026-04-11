/**
 * 클래스명을 조합하는 유틸리티 함수
 * tailwind 사용 시 clsx + tailwind-merge 로 교체를 권장합니다.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
