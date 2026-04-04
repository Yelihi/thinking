# Life's too short to hand-write API types: OpenAPI-driven React

> Transform your React development with contract-first APIs. Generate TypeScript types, build type-safe clients, and develop with mocks while backend implements—no more waiting, no more integration chaos.

- Date: 2026-02-25T00:00:00.000Z
- Authors: Yuri Mikhin, Travis Turner
- Categories: 
- URL: https://evilmartians.com/chronicles/lifes-too-short-to-hand-write-api-types-openapi-driven-react

---

Most React apps have a problem: frontend types and backend reality drifting apart. You copy API shapes into TypeScript files, backend changes something, and you find out in production. This guide fixes that by making your OpenAPI spec the source of truth—generating types, clients, and validation schemas automatically so contract mismatches break builds instead of production. You'll also set up network-level mocks so your team can build and test features against realistic API behavior without waiting on backend to deploy anything.

This is part three of our contract-first series ([part one](/chronicles/api-contracts-and-everything-i-wish-i-knew-a-frontend-survival-guide) | [part two](/chronicles/contract-shock-therapy-the-way-to-api-first-documentation-bliss)), but it works as a standalone guide if you're just here to wire OpenAPI into React.

In this demo app [[live](https://martian-hotel-booking-frontend.vercel.app/)] [[repo](https://github.com/mikhin/martian-hotel-booking-frontend)], we'll generate TypeScript types with Hey API, manage state with Nanostores, and mock APIs with MSW—everything you need to build a contract-driven React frontend.

__Table of contents__:
1. [Scaffolding Your React Project and Generating Types](#scaffolding-your-react-project-and-generating-types)
2. [Setting Up State Management with Nanostores and Nanoquery](#setting-up-state-management-with-nanostores-and-nanoquery)
3. [Building a Feature: Hotel Management Flow](#building-a-feature-hotel-management-flow)
4. [Mocking APIs for Seamless Development](#mocking-apis-for-seamless-development)

## Scaffolding your React project and generating types

Let's start from scratch. First, create a new Vite project with React and TypeScript:
```bash
$ pnpm create vite martian-hotel-frontend --template react-ts
$ cd martian-hotel-frontend
$ pnpm install
```

Vite gives you a clean React + TypeScript setup with hot module replacement and fast builds. No configuration needed to get started.

### How most teams handle APIs (spoiler: it's painful)

Here's what React + TypeScript API integration typically looks like. You manually write types by looking at backend responses:

```typescript
interface Hotel {
  id: string;
  name: string;
  status: string; // What values are valid? Who knows?
}
```

You write fetch wrappers by hand:

```typescript
async function getHotels(page: number): Promise<Hotel[]> {
  const response = await fetch(`/api/hotels?page=${page}`);
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
}

const hotels = await getHotels(1) as Hotel[];
```

And you cast everything and hope it's correct.

With this approach, problems pile up fast:
- **Types go stale** - backend changes `status` to an enum, your type still says `string`
- **No validation** - runtime data doesn't match your types, TypeScript just shrugs
- **Endless boilerplate** - copy-pasting the same fetch wrapper for the 47th time
- **Manual everything** - error handling, request building, response parsing, header setting, retry logic...

And when backend adds a required field or changes a type, you find out in production. Thus, TypeScript compiles successfully with outdated types.

### The solution: generate everything from contract

Instead of writing API code, you generate it. Instead of copying types, they're built from the source of truth. When the contract changes, regenerate and TypeScript immediately shows every place that needs updates.

This is where [Hey API](https://heyapi.dev/) comes in. Point it at your OpenAPI spec and it generates:
- **TypeScript types** that match your API exactly
- **SDK functions** with proper request/response handling–just call them
- **Runtime schemas** for validation, use Zod– it catches bad data before it breaks things
- **Client configuration** for base URLs and auth

You'll add Hey API as a dev dependency like so:
```bash
$ pnpm add @hey-api/openapi-ts -D -E
```

Then create `openapi-ts.config.ts` in your project root:
```typescript
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
```

This tells Hey API:
- **input**: where to find your OpenAPI spec (can be URL or local file)
- **output**: where to generate the SDK (`src/api` in this case)
- **plugins**: `zod` generates runtime validation schemas, `@hey-api/sdk` generates typed API functions

### Running generation

Add a script to `package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "openapi-ts": "openapi-ts"
  }
}
```

Now generate your types:
```bash
$ pnpm openapi-ts
```

Hey API reads your OpenAPI spec and generates TypeScript files in `src/api/`:
```
src/api/
├── client/
│   ├── client.gen.ts      # HTTP client configuration
│   ├── types.gen.ts       # Client-specific types
│   └── utils.gen.ts       # Client utilities
├── core/
│   ├── auth.gen.ts        # Authentication handling
│   ├── types.gen.ts       # Core type utilities
│   └── utils.gen.ts       # Core utilities
├── index.ts               # Main exports
├── sdk.gen.ts             # API endpoint functions
├── types.gen.ts           # Your API types
└── zod.gen.ts             # Zod validation schemas
```

### What you get

Open `src/api/types.gen.ts` and you'll see types matching your OpenAPI contract:
```typescript
export type Hotel = HotelUpsert & {
  id: string;
  createdAt: string;
};

export type HotelUpsert = {
  name: string;
  /**
   * Location on Mars
   */
  location: string;
  status: HotelStatus;
};

export type HotelStatus = "active" | "maintenance" | "closed";

export type GetHotelsData = {
  body?: never;
  path?: never;
  query: {
    page: number;
    pageSize: number;
    status?: HotelStatus;
  };
  url: "/hotels";
};

export type GetHotelsResponses = {
  /**
   * A paginated list of hotels
   */
  200: PaginatedResponse & {
    items: Array<Hotel>;
  };
};

export type GetHotelsResponse = GetHotelsResponses[keyof GetHotelsResponses];
```

These are your **business domain types**—the core data shapes your entire application works with: hotels, bookings, users, whatever your API manages. You never write these manually. Instead, they're generated from the contract and stay synchronized automatically.

The only types you'll write by hand are **UI-specific types**: these are component props, form state, local UI flags—things that exist only in the frontend and have nothing to do with the backend. This separation is powerful. Your business logic types come from the source of truth. Your presentation layer types are exactly what React needs, nothing more.

### Generated SDK functions

Open `src/api/sdk.gen.ts` and you'll find ready-to-use API functions:

```typescript
/**
 * Get all hotels
 */
export const getHotels = <ThrowOnError extends boolean = false>(
  options: Options<GetHotelsData, ThrowOnError>,
) =>
  (options.client ?? client).get<GetHotelsResponses, unknown, ThrowOnError>({
    security: [{ scheme: "bearer", type: "http" }],
    url: "/hotels",
    ...options,
  });
```

This function handles everything: building the request, setting auth headers, parsing the response, and returning typed data. You just call it:

```typescript
import { getHotels } from '@/api';

const response = await getHotels({
  query: { page: 1, pageSize: 10 }
});
// response.data is typed as GetHotelsResponse
```

No manual fetch wrappers, query string building, or response casting. The SDK does it all, with full type safety from your contract.

When the contract changes, run `pnpm openapi-ts` again. TypeScript immediately shows every place that needs updates: before you commit, before you deploy, before production breaks.

## Setting up state management with nanostores and nanoquery

Your generated SDK gives you type-safe API functions. Now you need to use them in React; most developers reach for this pattern:

```tsx
function HotelList() {
  const [hotels, setHotels] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getHotels({ query: { page: 1, pageSize: 10 } })
      .then(response => setHotels(response.data))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Error />;
  return hotels.items.map(hotel => <HotelCard {...hotel} />);
}
```

This works, but it's a trap. Here's why:
- **Fetching logic trapped inside component**-can't reuse it anywhere
- **No caching**-every mount hammers your API again
- **Can't share loading state**-other components don't know what's happening
- **Copy-paste hell**-need to refetch? rebuild this whole pattern
- **Testing nightmare**-mock at component level or cry

**The declarative alternative:** treat API data like any other state. Store it outside components. Subscribe to it. Let the store handle fetching, caching, and updates.

```tsx
// Store (outside component)
export const $hotels = createApiStore(getHotels, {
  storeKey: 'hotels',
  params: [/* pagination */],
});

// Component (just subscribes)
function HotelList() {
  const hotels = useStore($hotels);

  if (hotels.loading) return <Spinner />;
  if (hotels.error) return <Error />;
  return hotels.data.items.map(hotel => <HotelCard {...hotel} />);
}
```

And then, just watch what happens:
- **Multiple components share the same data**-fetch once, use everywhere
- **Automatic caching**-no more hammering your API on every render
- **Refetch in one line**-`$hotels.invalidate()` and you're done
- **Testing that doesn't suck**-mock the store, not 47 fetch calls
- **Loading states everywhere**-your whole app knows what's happening

We're using [**Nanostores**](https://github.com/nanostores/nanostores) with [**Nanoquery**](https://github.com/nanostores/query)—it's a lightweight alternative to React Query that works perfectly with contract-generated types.

### Choosing your state management approach

You could reach for React Query or SWR as they are both excellent libraries that handle caching and loading states. But here's the key difference: React Query couples data fetching to React components through hooks. Our approach treats API responses as global state that lives outside React entirely (like Redux or Zustand, but typed from your contract).

With this setup, your router can read API state, forms can invalidate it, and middleware can subscribe to it—all without React context. There's no need to fetch logic scattered across components. The stores wrap your generated SDK functions, giving you declarative state management with full type safety from your contract.

### Creating an API store wrapper

The wrapper we're building lets you turn any SDK function into a reactive store in a few lines. Here's what the end result looks like—let's create `src/stores/hotels.ts`:

```typescript
import { computed } from "nanostores";
import { createApiStore } from "./api-store";
import { getHotels, getHotelById } from "@/api";
import { $router } from "./router";

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

That's the entire file. Two stores, fully typed from your OpenAPI contract—`$hotels.data` is `GetHotelsResponse`, `$hotelContent.data` is `Hotel`. Change the contract, regenerate types, and TypeScript shows you what broke.

The first store fetches the hotel list with static query params. The second one watches your router—when you navigate to `/hotels/:id`, it automatically fetches that hotel's data. The `params` array accepts Nanostores atoms, so any change to the router triggers a refetch with the new ID.

#### How the wrapper works

The `createApiStore` function lives in [`src/stores/api-store.ts`](https://github.com/mikhin/martian-hotel-booking-frontend/blob/main/src/stores/api-store.ts). Here's what it does under the hood:

- **Type inference from SDK functions**—`ExtractOptionsData<F>` infers the data shape directly from the SDK function signature. When you pass `getHotels`, the wrapper knows what options it accepts without you specifying a single generic parameter.
- **Cache keys from `storeKey` + `params`**—Nanoquery uses the combined key to cache and deduplicate requests. When `params` change (like a router atom updating), it detects the new key and refetches automatically.
- **`mapToOptions`**—Converts your params into the SDK's `Options` type. For a parameterized store, it receives stringified params and returns typed options (e.g., `([id]) => ({ path: { id } })`).
- **Sensible defaults**—`onErrorRetry: false` and `revalidateOnFocus: false` keep the behavior predictable during development. You can override any Nanoquery `CommonSettings` in the config.

### Using stores in components

With your stores defined, using them in React is straightforward:

```tsx
import { useStore } from '@nanostores/react';
import { $hotels } from '../stores/hotels';

function HotelList() {
  const hotels = useStore($hotels);

  if (hotels.loading) return <Spinner />;
  if (hotels.error) return <Error message={hotels.error.message} />;

  return (
    <>
      {hotels.data.items.map(hotel => (
        <HotelCard key={hotel.id} {...hotel} />
      ))}
    </>
  );
}
```

The `useStore` hook subscribes to store changes and triggers re-renders. Nanoquery provides loading and error states automatically—no manual tracking needed.

## Building a feature: hotel management flow

Let's build a hotel management form using the contract-driven patterns. We'll create and edit hotels with validation, loading states, and error handling—all flowing from your OpenAPI spec.

So, users need to create and edit hotels. This means that our form needs:
- Hotel name and Mars location
- Status dropdown (active/maintenance/closed)
- Validation matching the API contract
- Loading states during save
- Error handling

Without contracts, you'd write the types by hand, hope they match the backend, and discover mistakes in production. With contracts, the types come from the spec and validation happens automatically.

### Setting up the form with validation

Create `src/HotelForm.tsx`. This component handles both creating and editing hotels—React Hook Form manages form state, and the generated Zod schema handles all validation:

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { createHotel, type HotelUpsert, updateHotel } from "@/api";
import { zHotelStatus, zHotelUpsert } from "@/api/zod.gen";
import { isValidationError } from "@/lib/is-validation-error";
import { $hotelContent, $hotels } from "@/stores/hotels";
import { $router } from "@/stores/router";

export function HotelForm() {
  const router = useStore($router);
  const hotelData = useStore($hotelContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = router?.route === "hotelEdit";
  const hotelId = isEditMode ? router.params.id : undefined;

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

The `zodResolver` connects the generated Zod schema to React Hook Form. We import both the TypeScript type (`HotelUpsert`) for compile-time safety and the Zod schema (`zHotelUpsert`) for runtime validation—every field validates against the exact rules your API expects. The `useEffect` loads existing data when editing; the store fetched it automatically when you navigated to this route.

### Handling submission

The submit handler branches on create vs. edit, then invalidates the store so the list refetches:

```tsx
  const onSubmit = async (data: HotelUpsert) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (isEditMode && hotelId) {
        await updateHotel({
          path: { id: hotelId },
          body: data,
        });
      } else {
        await createHotel({
          body: data,
        });
      }

      alert("Hotel saved!");
      $hotels.invalidate();
      $router.set({ route: "hotelList" });
    } catch (error) {
      console.error(error);

      if (isValidationError(error)) {
        const { errors } = error;

        if (errors) {
          Object.entries(errors).forEach(([fieldName, errorMessage]) => {
            form.setError(fieldName as keyof HotelUpsert, {
              message: errorMessage,
              type: "server",
            });
          });
        }
      }

      alert("Failed to save hotel");
    } finally {
      setIsSubmitting(false);
    }
  };
```

Both `createHotel` and `updateHotel` are generated from the contract—they know exactly what parameters they need. The `isValidationError` type guard narrows the error to your API's `ValidationError` type, mapping server-side field errors directly back to form fields. This works because both sides share the same contract.

### Building the form UI

The JSX wires each field to React Hook Form:

```tsx
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <label>
        Hotel Name
        <input
          {...form.register('name')}
          placeholder="Olympus Mons Resort"
        />
        <FieldError error={form.formState.errors.name} />
      </label>

      <label>
        Location on Mars
        <input
          {...form.register('location')}
          placeholder="Valles Marineris"
        />
        <FieldError error={form.formState.errors.location} />
      </label>

      <label>
        Status
        <select {...form.register('status')}>
          <option value="">Select status</option>
          {zHotelStatus.options.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
        <FieldError error={form.formState.errors.status} />
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Hotel'}
      </button>
    </form>
  );
}
```

Notice there's no manual `required: true` on any field—the Zod schema handles all validation rules. The status dropdown options are derived from `zHotelStatus.options`, so they stay in sync with the contract automatically—if backend adds or removes a status, you regenerate and the dropdown updates without touching any JSX.

### What just happened?

You built a complete CRUD feature:
- Types are inferred from Zod schemas (runtime + compile-time safety)
- Validation happens automatically from your contract
- Form fields are type-checked against the API
- No manual type writing anywhere

When backend adds a `pricePerNight` field to the contract:
1. Types and schemas are regenerated
2. TypeScript errors show the form is missing a field
3. Input is added
4. Zod validates it automatically
5. Integration works on first try

**This is contract-first development.** The contract is the source of truth. Your code is a projection of it. Change the contract, regenerate, fix the errors, done.

## Mocking APIs for seamless development

Remember the "backend isn't ready" bottleneck from earlier? This is where we eliminate it completely! With MSW (Mock Service Worker), you build features against realistic API responses without waiting for backend deployment.

### Why mock at the network level?

Most developers reach for this pattern:
```typescript
// ❌ Component-level mocking - tightly coupled
function HotelList() {
  const [hotels, setHotels] = useState(mockHotels); // Fake data in component
  // ...
}
```

However, this creates a number of problems:
- **Mocks live in components**-can't reuse them across the app
- **No real network behavior**-meaning missed loading states, race conditions, errors
- **Testing nightmare**-you end up with mocks scattered everywhere
- **Can't toggle real/mock**-no easy switch to staging API

**MSW intercepts at the network layer.** Your app makes real `fetch()` calls. MSW catches them and returns mock responses. You can switch between mock and real APIs by enabling/disabling MSW—no code changes.

```typescript
// ✅ Your app code stays identical
const response = await getHotels({ query: { page: 1, pageSize: 10 } });
// MSW intercepts and returns mock data
```

### A contract-driven mock setup

So, everything flows from your OpenAPI contract: the types, the paths, the response shapes—all generated. Your mocks will use the exact same types as your real API calls.

Install MSW:
```bash
$ pnpm add msw -D
```

Create the mock configuration in `src/mocks/handlers.ts`. Start with imports and app config:
```typescript
import { http, HttpResponse } from "msw";
import { nanoid } from "nanoid";

import type {
  CreateHotelData,
  CreateHotelResponse,
  DeleteHotelData,
  GetHotelByIdData,
  GetHotelByIdResponse,
  GetHotelsData,
  GetHotelsResponse,
  Hotel,
  UpdateHotelData,
  UpdateHotelResponse,
} from "@/api/types.gen";
import { getAppConfig } from "@/config/app.config";

import type { MswPath } from "./types";
import { randomDelay } from "./utils";

const appConfig = getAppConfig();
```

Notice every type—`GetHotelsData`, `Hotel`, `CreateHotelResponse`—comes from your generated SDK with no manual type writing required. Again, the contract is the source of truth.

### Type-safe path definitions

Now, define your API paths with compile-time validation:
```typescript
const PATHS = {
  hotelById: "/hotels/:id" satisfies MswPath<GetHotelByIdData["url"]> &
    MswPath<UpdateHotelData["url"]> &
    MswPath<DeleteHotelData["url"]>,
  hotels: "/hotels" satisfies MswPath<GetHotelsData["url"]> &
    MswPath<CreateHotelData["url"]>,
} as const;
```

The `MswPath` utility type converts OpenAPI path syntax (`/hotels/{id}`) to MSW syntax (`/hotels/:id`):
```typescript
export type MswPath<T extends string> =
  T extends `${infer A}{${infer Param}}${infer B}`
    ? `${A}:${Param}${MswPath<B>}`
    : T;
```

The `satisfies` operator ensures your paths match the contract. If the contract changes from `/hotels/{id}` to `/hotels/{hotelId}`, TypeScript errors immediately. Multiple `satisfies` clauses mean one path handles multiple operations: GET, PUT, DELETE all use `/hotels/:id`.

### Building realistic mock data

Let's create some initialization logic that mimics real database state:
```typescript
const initializeMockHotels = (): Hotel[] => {
  return [
    {
      id: nanoid(),
      name: "Olympus Mons Resort",
      location: "Olympus Mons",
      status: "active",
      createdAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      name: "Valles Marineris Hotel",
      location: "Valles Marineris",
      status: "maintenance",
      createdAt: new Date().toISOString(),
    },
  ];
};

const mockHotels = initializeMockHotels();
```

This isn't merely static JSON; rather, it's **stateful**. You create a hotel and it persists across requests. Update one and the change reflects in list endpoints. Delete one and it disappears. In simple terms: your mocks behave like a real database.

### Organizing handlers by path

```typescript
export const hotelHandlerMap = {
  [PATHS.hotelById]: [
    http.get<GetHotelByIdData["path"], never, GetHotelByIdResponse>(
      `${appConfig.backendUrl}${PATHS.hotelById}`,
      async ({ params }) => {
        await randomDelay(500, 1500);

        const hotel = mockHotels.find((h) => h.id === params.id);

        if (!hotel) {
          return HttpResponse.error();
        }

        return HttpResponse.json(hotel);
      },
    ),
    http.put<
      UpdateHotelData["path"],
      UpdateHotelData["body"],
      UpdateHotelResponse
    >(
      `${appConfig.backendUrl}${PATHS.hotelById}`,
      async ({ params, request }) => {
        await randomDelay(500, 1500);

        const { id } = params;
        const body = await request.json();

        const index = mockHotels.findIndex((h) => h.id === id);
        const existingHotel = mockHotels[index];

        if (index === -1 || !existingHotel) {
          return HttpResponse.error();
        }

        mockHotels[index] = {
          ...existingHotel,
          ...body,
          id: existingHotel.id,
          createdAt: existingHotel.createdAt,
        };

        return HttpResponse.json(mockHotels[index]);
      },
    ),
    http.delete<DeleteHotelData["path"], never, never>(
      `${appConfig.backendUrl}${PATHS.hotelById}`,
      async ({ params }) => {
        await randomDelay(500, 1500);

        const index = mockHotels.findIndex((h) => h.id === params.id);

        if (index === -1) {
          return HttpResponse.error();
        }

        mockHotels.splice(index, 1);

        return new HttpResponse(null, { status: 204 });
      },
    ),
  ],
  [PATHS.hotels]: [
    // ... collection handlers
  ],
} as const;
```

**Key patterns:**

**Network realism with `randomDelay`:**
```typescript
await randomDelay(500, 1500);
```

Of course, real networks aren't instant: random delays expose race conditions, test loading states, and catch bugs you'd only see in production. The delay range (500-1500ms) mimics typical API response times.

**Full generic typing:**
```typescript
http.get<GetHotelByIdData["path"], never, GetHotelByIdResponse>
```

Three type parameters:
1. Path params (`{ id: string }`)
2. Request body (`never` for GET)
3. Response type (`Hotel`)

TypeScript validates everything—params match the path, body matches the schema, response matches the contract.

**Immutable updates:**
```typescript
mockHotels[index] = {
  ...existingHotel,
  ...body,
  id: existingHotel.id,
  createdAt: existingHotel.createdAt,
};
```

We preserve system fields (`id`, `createdAt`) while allowing business fields to update. This mirrors real backend behavior where users can't change IDs or creation timestamps.

### Implementing collection endpoints

List and create operations need different handling:
```typescript
[PATHS.hotels]: [
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
  ),
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
  ),
],
```

**Pagination logic:**
```typescript
const start = (page - 1) * pageSize;
const response: GetHotelsResponse = {
  currentPage: page,
  items: filtered.slice(start, start + pageSize),
  pageSize,
  totalItems: filtered.length,
  totalPages: Math.ceil(filtered.length / pageSize),
};
```

This matches real API pagination. So, frontend can request page 2 with 10 items and get exactly that. This unlocks the ability to easily test edge cases: the last page with fewer items, empty results, out-of-bounds pages, and so on.

**Filtering support:**
```typescript
const status = url.searchParams.get("status");

if (status) {
  filtered = filtered.filter((h) => h.status === status);
}
```

Query params work exactly like the real API. You request `?status=active` and get only active hotels. Add more filters as your contract evolves: location, date ranges, search terms.

**Creation with proper status codes:**
```typescript
return HttpResponse.json(newHotel, { status: 201 });
```

RESTful APIs return `201 Created` for successful POSTs. MSW lets you test status code handling—for instance, does your UI properly handle 201 vs. 200?

### Wiring up MSW

Create `src/mocks/browser.ts` to initialize the service worker:
```typescript
import { setupWorker } from "msw/browser";

import { hotelHandlerMap } from "./handlers";

export const createWorker = () => {
  const handlers = Object.values(hotelHandlerMap).flat();

  return setupWorker(...handlers);
};
```

Enable mocks conditionally in your app entry point (`src/main.tsx`):
```typescript
import { createRoot } from "react-dom/client";

import { getAppConfig } from "@/config/app.config";

import "./index.css";
import { App } from "./App";

const appConfig = getAppConfig();

const enableMocking = async (): Promise<
  ServiceWorkerRegistration | undefined
> => {
  if (!appConfig.enableMocks) {
    return undefined;
  }

  try {
    const { createWorker } = await import("./mocks/browser");
    const worker = createWorker();

    return await worker.start({
      onUnhandledRequest: "bypass",
    });
  } catch (error) {
    console.warn("MSW failed to start:", error);

    return undefined;
  }
};

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
```

**Key decisions in this setup:**

**Config-driven mocking:** The `enableMocks` flag controls whether MSW runs. This lives in your app config, not hardcoded environment checks. You can enable mocks in development, disable for staging, or even toggle them in production for demo environments.

**Dynamic import:** `await import("./mocks/browser")` means mock code never bundles into production builds when mocks are disabled. Tree-shaking removes all MSW code automatically.

**Graceful failure:** If MSW fails to start (service worker registration issues, browser compatibility), the app still renders. The `try/catch` logs a warning but doesn't block initialization—better to run without mocks than not run at all.

**Switching between mock and real APIs:**
```typescript
// config/app.config.ts
import { z } from "zod";

const AppConfigSchema = z.object({
  backendUrl: z.string().min(1),
  enableMocks: z
    .string()
    .transform((v) => v === "true")
    .pipe(z.boolean()),
  envMode: z.enum(["development", "production", "test"]),
});

export type ApplicationConfig = z.infer<typeof AppConfigSchema>;

const getEnv = (key: string, fallback = ""): string => {
  return import.meta.env[key] || fallback;
};

export const getAppConfig = (): ApplicationConfig => {
  try {
    return AppConfigSchema.parse({
      backendUrl: getEnv("VITE_BACKEND_URL"),
      enableMocks: getEnv("VITE_API_MOCKS", "false"),
      envMode: getEnv("MODE", "development"),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => {
          const path = issue.path.join(".") || "<root>";
          return `${path}: ${issue.message}`;
        })
        .join("; ");

      throw new Error(
        `Invalid application configuration from environment variables: ${issues}`,
      );
    }
    throw error;
  }
};
```
```bash
# Development - uses mocks
VITE_API_MOCKS=true

# Staging - uses real API
VITE_API_MOCKS=false
VITE_BACKEND_URL=https://staging-api.example.com
```

The config uses Zod to validate environment variables at startup—if something is missing or wrong, you get a clear error message immediately instead of mysterious runtime failures. Change environment variables and you're testing against different backends. Same code, different data source. No conditional logic scattered through your app.

### The development flow

Now watch what happens:

1. **Contract changes**-backend adds `pricePerNight` field to `Hotel`
2. **Regenerate types**-run `pnpm openapi-ts`
3. **TypeScript errors**-your mock initialization doesn't include the new field
4. **Update mocks**-add `pricePerNight: 100` to mock hotels
5. **Update UI**-forms and displays automatically get the new field

Everything flows from the contract. Your mocks can't drift from the real API because they're built from the same types.

### Testing edge cases

Mocks let you test scenarios that are hard to reproduce with real APIs:

**Simulate errors:**
```typescript
http.get(`${appConfig.backendUrl}/hotels/:id`, async ({ params }) => {
  if (params.id === "error-test") {
    return HttpResponse.error();
  }
  // ... normal logic
});
```

**Slow responses:**
```typescript
await randomDelay(5000, 10000); // Test loading states with slow networks
```

**Empty states:**
```typescript
const mockHotels: Hotel[] = []; // What happens when no data exists?
```

**Validation errors:**
```typescript
http.post(`${appConfig.backendUrl}/hotels`, async ({ request }) => {
  const body = await request.json();

  if (!body.name) {
    return HttpResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }
  // ... create logic
});
```

Real backends don't let you easily trigger these scenarios. Mocks make doing so trivial.

### Why does this actually matter?

**Parallel development becomes real.** Backend works on the actual implementation. Frontend builds features using contract-generated mocks. Both teams converge on the same specification. Integration is just "disable mocks and test"—not a week-long debugging marathon.

**Your code quality improves.** Loading states work correctly because you test them. Error handling catches real issues. Edge cases don't slip through. You're building against realistic behavior, not wishful thinking.

**Velocity increases.** No more "waiting for backend" delays or integration surprises. Features ship when you finish building them, not when backend finishes deploying.

To solidify again: the contract is the agreement. The mocks enforce that agreement. Your app works before backend writes a single line of code.

## Recap: what we've built

We started with a raw Vite + React project and ended with a fully contract-driven frontend: Hey API generates TypeScript types and API clients straight from the OpenAPI spec, Nanostores and Nanoquery handle state without the boilerplate, and MSW mocks let you build and test features before backend deploys anything. When the contract changes, you regenerate—TypeScript tells you exactly what broke.

That covers the frontend half of the equation. But the contract serves both sides. In [part four](/chronicles/openapi-fastify-backend-let-the-contract-build-your-server), we'll flip to the backend and wire the same OpenAPI spec into a Node.js Fastify server—automatic route validation, generated types, and a setup where contract violations fail at startup, not in production.
