export type UrlStoreInterface = {
  add: (url: string) => void
  revoke: (url: string) => void
  revokeAll: () => void
}
