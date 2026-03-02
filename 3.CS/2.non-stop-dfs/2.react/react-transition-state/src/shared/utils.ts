export const makeArrayItems = (length: number) => {
    return Array.from({ length }, (_, i) => `item-${i}`)
}