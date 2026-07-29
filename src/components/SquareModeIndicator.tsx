import { useEffect, useRef, useState } from 'react'

const HIDE_DELAY_MS = 600
const SQUARE_TOLERANCE_PX = 2

export function SquareModeIndicator() {
  const [size, setSize] = useState({ width: window.outerWidth, height: window.outerHeight })
  const [visible, setVisible] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleResize() {
      setSize({ width: window.outerWidth, height: window.outerHeight })
      setVisible(true)
      if (hideTimer.current) clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(() => setVisible(false), HIDE_DELAY_MS)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  const isSquare = Math.abs(size.width - size.height) <= SQUARE_TOLERANCE_PX

  return (
    <div
      data-testid="square-mode-indicator"
      aria-hidden="true"
      className={`fixed bottom-6 left-6 z-[60] pointer-events-none rounded-full bg-gray-900/80 px-3 py-1.5 font-mono text-sm shadow-lg transition-opacity duration-[250ms] ${
        visible ? 'opacity-100' : 'opacity-0'
      } ${isSquare ? 'text-green-400' : 'text-white'}`}
    >
      {size.width} × {size.height}
    </div>
  )
}
