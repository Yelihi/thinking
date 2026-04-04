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

const PATHS = {
  hotelById: "/hotels/:id" satisfies MswPath<GetHotelByIdData["url"]> &
    MswPath<UpdateHotelData["url"]> &
    MswPath<DeleteHotelData["url"]>,
  hotels: "/hotels" satisfies MswPath<GetHotelsData["url"]> &
    MswPath<CreateHotelData["url"]>,
} as const;

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
} as const;
