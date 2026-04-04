import { computed } from "nanostores";

import { getHotelById, getHotels } from "@/api";

import { createApiStore } from "./api-store";
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
