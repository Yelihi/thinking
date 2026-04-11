export function pushBound<T>(buffer: T[], newItem: T, maxSize: number): T[] {
    const newBuffer = [...buffer, newItem];

    return newBuffer.length > maxSize ? newBuffer.slice(-maxSize) : newBuffer
}