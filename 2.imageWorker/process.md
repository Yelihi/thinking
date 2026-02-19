# ImagePrepPanel 다수 이미지 업로드 지원

## 목표

- `useImageResize` → `useImageResizeQueue`로 전환
- 다수 파일 선택 지원
- 여러 이미지 동시 표시 및 처리
- 로딩 중 Skeleton UI 표시

## 변경 사항

### 1. 컴포넌트 수정/생성

#### `FileInputSet.tsx` 수정

- `multiple` 속성 추가
- `onFileChange` → `onFilesChange` (File[] 받도록 변경)
- 다수 파일 선택 안내 문구 추가

#### `FileInformation.tsx` 수정 → `FileInformationList.tsx`로 변경

- 단일 파일 정보 → 파일 배열 정보 표시
- 각 파일의 이름, 타입, 크기를 리스트로 표시

#### `ImageResizeProcess.tsx` 수정 → `ImageResizeProcessList.tsx`로 변경

- 단일 이미지 처리 → 여러 이미지 리스트 처리
- 각 이미지마다:
  - 상태별 표시 (queued/processing/done/failed)
  - Skeleton UI (processing 상태일 때)
  - 완료된 이미지 썸네일 및 정보
  - 에러 메시지 표시

#### `ImageSkeleton.tsx` 신규 생성

- 로딩 중 표시할 Skeleton UI 컴포넌트
- 이미지 썸네일 + 정보 영역 스켈레톤

### 2. `ImagePrepPanel.tsx` 수정

- `useImageResize` → `useImageResizeQueue`로 변경
- 파일 선택 시 `enqueueFiles` 호출
- "처리 시작" 버튼 추가 (큐에 아이템이 있을 때 활성화)
- `items` 배열을 `ImageResizeProcessList`에 전달
- 통계 표시 (대기/처리중/완료/실패 개수)

## 파일 구조

```
src/
├── components/
│   ├── FileInputSet.tsx (수정: 다수 파일 선택)
│   ├── FileInformation.tsx (수정: 리스트 표시)
│   ├── ImageResizeProcess.tsx (수정: 리스트 표시)
│   └── ImageSkeleton.tsx (신규)
└── pages/
    └── ImagePrepPanel.tsx (수정: useImageResizeQueue 사용)
```

## 주요 기능

- 다수 이미지 선택 및 큐에 추가
- 동시성 제어 (기본 2개 동시 처리)
- 실시간 상태 업데이트
- Skeleton UI로 로딩 상태 표시
- 개별 이미지 삭제 기능
- 전체 초기화 기능