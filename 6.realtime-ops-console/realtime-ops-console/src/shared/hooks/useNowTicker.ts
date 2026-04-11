import { useEffect, useState } from "react"

import { NOW_TICKER_INTERVAL_MS } from "@/shared/config/constants"

export function useNowTicker(intervalMs: number = NOW_TICKER_INTERVAL_MS) {
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        const id = setInterval(() => {
            setNow(Date.now())
        }, intervalMs)

        return () => clearInterval(id)
    }, [intervalMs])

    return now
}