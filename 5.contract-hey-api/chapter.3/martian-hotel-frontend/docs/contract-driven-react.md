# OpenAPI 기반 React 프론트엔드 흐름 정리

## 0. 문제의식과 목표
대부분의 React 앱에서 프론트 타입과 실제 백엔드 응답이 금방 어긋난다. 백엔드가 스펙을 고치면 프론트 타입은 갱신되지 않아 프로덕션에서야 문제를 발견한다. 이 문서는 OpenAPI 스펙을 단일 소스 오브 트루스로 삼아 타입·SDK·검증 스키마를 자동 생성하고, 계약 불일치를 빌드 시점에 드러내며, MSW로 현실적인 목 환경을 구성하는 전체 플로우를 정리한다. 데모는 Hey API(코드 생성), Nanostores + Nanoquery(상태), MSW(네트워크 레벨 목)를 사용한 Martian Hotel 앱이다.

## 1. Vite + Hey API로 기본 뼈대 잡기
1. `pnpm create vite martian-hotel-frontend --template react-ts`
2. `pnpm install`
3. `pnpm add -D @hey-api/openapi-ts`
4. `openapi-ts.config.ts` 에 입력 스펙 URL(`https://martian-hotel-booking-api.vercel.app/output.yml`), 출력 디렉터리(`src/api`), 플러그인(`zod`, `@hey-api/sdk`) 지정
5. `pnpm openapi-ts` → `src/api` 아래에 타입(`types.gen.ts`), SDK(`sdk.gen.ts`), 클라이언트(`client.gen.ts`), Zod 스키마(`zod.gen.ts`) 생성

생성물 의미
- `types.gen.ts`: `Hotel`, `HotelStatus`, `HotelUpsert`, `GetHotelsData` 등 비즈니스 타입 전체
- `sdk.gen.ts`: `getHotels`, `createHotel` 같은 함수 SDK. 옵션과 응답 타입이 모두 계약 기반으로 안전하다.
- 계약 변경 시 `pnpm openapi-ts` 재실행 → TypeScript 에러가 필요한 수정 지점을 가리킨다.

```ts
// openapi-ts.config.ts
import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "https://martian-hotel-booking-api.vercel.app/output.yml",
  output: "src/api",
  plugins: [
    "zod",
    {
      name: "@hey-api/sdk",
    },
  ],
});

// 생성된 client.gen.ts 일부
export const client = createClient(
  createConfig<ClientOptions2>({ baseUrl: "http://localhost:3000" }),
);

// main.tsx에서 런타임 구성 적용
client.setConfig({
  baseUrl: appConfig.backendUrl,
  throwOnError: true,
});
```

## 2. Nanostores + Nanoquery로 API 상태 관리
### 2-1. 기존 컴포넌트 내 fetch 패턴 문제
- 로직 재사용 어려움, 캐싱 부재, 글로벌 로딩 공유 불가, 반복 보일러플레이트, 테스트 난이도 상승.

### 2-2. 선언적 전역 스토어 패턴
- SDK 함수를 `createApiStore`로 감싸 전역 스토어(`$hotels`, `$hotelContent`)화.
- 컴포넌트는 `useStore`로 구독만 담당 → 로딩/에러/데이터 자동 제공.
- 라우터, 폼, 모달 등 React 외부 코드에서도 동일 상태 활용 가능.

### 2-3. `createApiStore` 동작 (`src/stores/api-store.ts`)
- `StoreConfig`에 `storeKey`, `params`, `mapToOptions` 지정.
- 내부에서 Nanoquery `createFetcherStore` 사용, 캐시 키 = `storeKey + params`.
- `getHotels` 예시: 고정 쿼리(`page`, `pageSize`).
- `getHotelById` 예시: `$router` atom 변화를 `computed`로 감시, ID가 바뀌면 자동 재패치.

```ts
export const $hotels = createApiStore(getHotels, {
  storeKey: "hotelsList",
  mapToOptions: () => ({
    query: { page: 1, pageSize: 10 },
  }),
});

export const $hotelContent = createApiStore(getHotelById, {
  storeKey: "hotelContent",
  params: [
    computed($router, (router) =>
      router?.route === "hotelEdit" ? router.params.id : null,
    ),
  ],
  mapToOptions: ([id]) => ({
    path: { id: id ?? "" },
  }),
});
```

```ts
// createApiStore 핵심(fetcher 부분)
const [createFetcherStore] = nanoquery({});

return createFetcherStore(storeParams, {
  fetcher: async (...fetchParams) => {
    const [_, ...queryParams] = fetchParams;
    const mappedParams = queryParams.map(String);

    const options = config.mapToOptions
      ? config.mapToOptions(mappedParams as never)
      : {};

    const result = await fetcher({
      ...options,
      throwOnError: true,
    } as never);

    if (result.data === undefined) {
      throw new Error("No data received");
    }

    return result.data;
  },
  onErrorRetry: false,
  revalidateOnFocus: false,
});
```

## 3. Hotel Form 기능 구현
### 3-1. 폼 셋업 (`src/HotelForm.tsx`)
- `useForm<HotelUpsert>` + `zodResolver(zHotelUpsert)`로 계약 기반 타입/검증을 동기화.
- 에디트 모드에서는 `$hotelContent` 데이터를 `form.reset`으로 주입.

```tsx
const form = useForm<HotelUpsert>({
  defaultValues: {
    name: undefined,
    location: undefined,
    status: undefined,
  },
  resolver: zodResolver(zHotelUpsert),
});

useEffect(() => {
  if (hotelData?.data) {
    form.reset({
      name: hotelData.data.name,
      location: hotelData.data.location,
      status: hotelData.data.status,
    });
  }
}, [hotelData?.data, form]);
```

### 3-2. 제출 처리
- 에디트 vs 생성 분기 후 `updateHotel` / `createHotel` 호출.
- 성공 시: 알림 → `$hotels.invalidate()` → `$router`로 목록 이동.
- 실패 시: `isValidationError`(계약 타입)로 서버 검증 에러를 필드별 `setError`로 매핑.

```tsx
const onSubmit = async (data: HotelUpsert) => {
  if (isSubmitting) return;
  setIsSubmitting(true);

  try {
    if (isEditMode && hotelId) {
      await updateHotel({ path: { id: hotelId }, body: data });
    } else {
      await createHotel({ body: data });
    }

    alert("Hotel saved!");
    $hotels.invalidate();
    $router.set({ route: "hotelList" });
  } catch (error) {
    if (isValidationError(error) && error.errors) {
      Object.entries(error.errors).forEach(([fieldName, errorMessage]) => {
        form.setError(fieldName as keyof HotelUpsert, {
          message: errorMessage,
          type: "server",
        });
      });
    }

    alert("Failed to save hotel");
  } finally {
    setIsSubmitting(false);
  }
};
```

### 3-3. UI
- 필드 등록은 `form.register` 사용.
- 상태 옵션은 `zHotelStatus.options`에서 직접 가져와 계약과 즉시 동기화.
- 모든 필수/enum 검증을 Zod가 담당하므로 JSX에는 `required` 같은 수동 규칙이 없다.

## 4. MSW로 계약 기반 목 구성
### 4-1. 왜 네트워크 레벨 목인가
- 컴포넌트별 mock 데이터는 재사용/현실감/테스트 전환이 어렵다.
- MSW는 실제 `fetch`를 가로채므로 앱 코드를 바꾸지 않고 mock ↔ real 스위칭 가능.

### 4-2. 계약 타입과 경로 검증
- `src/mocks/handlers.ts`: 생성된 타입들(`GetHotelsData`, `Hotel`, etc.)과 앱 설정(`getAppConfig`)을 import.
- `MswPath<T>` 타입으로 `/hotels/{id}` → `/hotels/:id` 변환. `satisfies`를 통해 경로 문자열이 계약 `url` 타입과 일치하도록 강제.

```ts
const PATHS = {
  hotelById: "/hotels/:id" satisfies MswPath<GetHotelByIdData["url"]> &
    MswPath<UpdateHotelData["url"]> &
    MswPath<DeleteHotelData["url"]>,
  hotels: "/hotels" satisfies MswPath<GetHotelsData["url"]> &
    MswPath<CreateHotelData["url"]>,
} as const;

export type MswPath<T extends string> =
  T extends `${infer A}{${infer Param}}${infer B}`
    ? `${A}:${Param}${MswPath<B>}`
    : T;
```

### 4-3. 목 상태와 핸들러
- `initializeMockHotels`로 인메모리 DB 역할 리스트 생성.
- `hotelHandlerMap`: `/hotels/:id`에 GET/PUT/DELETE, `/hotels`에 GET/POST 정의.
- 모든 핸들러에 `randomDelay(500,1500)` 적용, 페이지네이션/필터/상태 코드(201,204)를 계약과 동일하게 구현.
- `http.<method>` 제네릭으로 path/body/response 타입을 계약에 맞춰 강제.

```ts
const mockHotels = initializeMockHotels();

http.get<never, never, GetHotelsResponse>(
  `${appConfig.backendUrl}${PATHS.hotels}`,
  async ({ request }) => {
    await randomDelay(500, 1500);
    const url = new URL(request.url);
    const page = +(url.searchParams.get("page") || 1);
    const pageSize = +(url.searchParams.get("pageSize") || 10);
    const status = url.searchParams.get("status");

    let filtered = mockHotels;
    if (status) {
      filtered = filtered.filter((h) => h.status === status);
    }

    const start = (page - 1) * pageSize;
    const response: GetHotelsResponse = {
      currentPage: page,
      items: filtered.slice(start, start + pageSize),
      pageSize,
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / pageSize),
    };

    return HttpResponse.json(response);
  },
);

http.post<never, CreateHotelData["body"], CreateHotelResponse>(
  `${appConfig.backendUrl}${PATHS.hotels}`,
  async ({ request }) => {
    await randomDelay(500, 1500);
    const body = await request.json();
    const newHotel: Hotel = {
      id: nanoid(),
      ...body,
      createdAt: new Date().toISOString(),
    };
    mockHotels.push(newHotel);
    return HttpResponse.json(newHotel, { status: 201 });
  },
);
```

### 4-4. 워커 초기화 & 환경 토글
- `src/mocks/browser.ts`: `setupWorker(...handlers)`.
- `src/main.tsx`: `getAppConfig()`로 `VITE_BACKEND_URL`, `VITE_API_MOCKS` 읽고 검증 후 SDK `client.setConfig`에 적용. `enableMocks`가 true일 때만 동적 import로 worker start.
- `.env.development.local.example`: 기본 backend URL + mocks 활성화 예시.

```tsx
const appConfig = getAppConfig();

client.setConfig({
  baseUrl: appConfig.backendUrl,
  throwOnError: true,
});

const enableMocking = async (): Promise<
  ServiceWorkerRegistration | undefined
> => {
  if (!appConfig.enableMocks) {
    return undefined;
  }

  try {
    const { createWorker } = await import("./mocks/browser");
    const worker = createWorker();
    return await worker.start({ onUnhandledRequest: "bypass" });
  } catch (error) {
    console.warn("MSW failed to start:", error);
    return undefined;
  }
};

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
```

### 4-5. 개발 플로우
1. OpenAPI 변경 → `pnpm openapi-ts` → 타입/스키마/목 타입 업데이트.
2. TypeScript 에러가 빠진 필드를 알려줌 → 목/폼/UI 수정.
3. MSW로 느린 응답, 빈 리스트, 검증 에러 등 현실적인 시나리오 마음껏 테스트.

## 5. 정리
- Vite + React + TS + Hey API로 계약 기반 타입/SDK/Zod 스키마 자동화.
- Nanostores + Nanoquery로 API 상태를 전역 스토어에 담아 재사용/캐싱.
- MSW로 실제 백엔드 없이도 현실적인 개발/테스트 경험 제공.
- 계약이 단일 소스 오브 트루스: 변경 시 코드 생성 → 컴파일 에러 → 수정 → 안정된 통합.
- 현재 프로젝트(`martian-hotel-frontend`)는 위 흐름이 모두 구현되어 있으며, Node 20.19+ 이상에서 `pnpm dev` 혹은 `pnpm build`로 실행 가능하다(현재 시스템은 Node 18.17.1이라 업그레이드 필요).
