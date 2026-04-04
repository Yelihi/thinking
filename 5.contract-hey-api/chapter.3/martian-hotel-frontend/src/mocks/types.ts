export type MswPath<T extends string> =
  T extends `${infer A}{${infer Param}}${infer B}`
    ? `${A}:${Param}${MswPath<B>}`
    : T;
