import type { UrlStoreInterface } from './interface'

export const urlStore = (): UrlStoreInterface => {
  const set = new Set<string>()

  return {
    add: (url: string) => {
      set.add(url)
    },
    revoke: (url: string) => {
      if (!set.has(url)) return
      URL.revokeObjectURL(url)
      set.delete(url)
    },
    revokeAll: () => {
      for (const url of set) URL.revokeObjectURL(url)
      set.clear()
    },
  }
}
