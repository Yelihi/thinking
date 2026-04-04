import { atom } from "nanostores";

export type RouterState =
  | { route: "hotelEdit"; params: { id: string } }
  | { route: "hotelCreate" }
  | { route: "hotelList" }
  | null;

export const $router = atom<RouterState>(null);
