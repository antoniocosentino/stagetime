import { useEffect, useRef, useState } from 'react'

export function useShuffleAnimation(onShuffle: () => void) {
  const [shuffling, setShuffling] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isShufflingRef = useRef(false)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  function trigger() {
    if (isShufflingRef.current) return
    isShufflingRef.current = true
    setShuffling(true)
    timeoutRef.current = setTimeout(() => {
      onShuffle()
      setShuffling(false)
      isShufflingRef.current = false
    }, 2000)
  }

  return { shuffling, trigger }
}
