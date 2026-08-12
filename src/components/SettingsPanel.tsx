import { useState, useEffect, useRef } from 'react'

interface Props {
  names: string[]
  timeLimitMinutes: number
  idleTimeMinutes: number
  squareModeEnabled: boolean
  onAddName: () => void
  onRemoveName: (name: string) => void
  onChangeName: (oldName: string, newName: string) => void
  onSetTimeLimit: (minutes: number) => void
  onSetIdleTime: (minutes: number) => void
  onToggleSquareMode: () => void
  onShuffle: () => void
  onClose: () => void
}

export function SettingsPanel({
  names,
  timeLimitMinutes,
  idleTimeMinutes,
  squareModeEnabled,
  onAddName,
  onRemoveName,
  onChangeName,
  onSetTimeLimit,
  onSetIdleTime,
  onToggleSquareMode,
  onShuffle,
  onClose,
}: Props) {
  const [timeValue, setTimeValue] = useState(String(timeLimitMinutes))
  useEffect(() => { setTimeValue(String(timeLimitMinutes)) }, [timeLimitMinutes])

  const [idleValue, setIdleValue] = useState(String(idleTimeMinutes))
  useEffect(() => { setIdleValue(String(idleTimeMinutes)) }, [idleTimeMinutes])

  const [closing, setClosing] = useState(false)
  function handleClose() {
    setClosing(true)
    setTimeout(onClose, 250)
  }

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const prevLengthRef = useRef(names.length)
  useEffect(() => {
    if (names.length > prevLengthRef.current) {
      const last = inputRefs.current[names.length - 1]
      last?.focus()
      last?.select()
    }
    prevLengthRef.current = names.length
  }, [names.length])

  const [shuffling, setShuffling] = useState(false)
  const shuffleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const shuffleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (shuffleIntervalRef.current) clearInterval(shuffleIntervalRef.current)
      if (shuffleTimeoutRef.current) clearTimeout(shuffleTimeoutRef.current)
    }
  }, [])

  function handleShuffleClick() {
    if (shuffling) return
    setShuffling(true)
    onShuffle()
    shuffleIntervalRef.current = setInterval(onShuffle, 150)
    shuffleTimeoutRef.current = setTimeout(() => {
      if (shuffleIntervalRef.current) {
        clearInterval(shuffleIntervalRef.current)
        shuffleIntervalRef.current = null
      }
      setShuffling(false)
    }, 3000)
  }

  return (
    <div
      className={`fixed inset-0 bg-black/40 flex justify-end z-50 ${closing ? 'animate-[fade-out_0.25s_ease-in_forwards]' : 'animate-[fade-in_0.2s_ease-out]'}`}
      onClick={handleClose}
    >
      <div
        className={`bg-white w-full max-w-sm h-full flex flex-col shadow-xl ${closing ? 'animate-[slide-out-right_0.25s_ease-in_forwards]' : 'animate-[slide-in-right_0.25s_ease-out]'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Settings</h2>
          <button
            aria-label="Close"
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <label htmlFor="square-mode-toggle" className="text-sm font-medium text-gray-700">
              Square mode
            </label>
            <button
              id="square-mode-toggle"
              type="button"
              role="switch"
              aria-checked={squareModeEnabled}
              onClick={onToggleSquareMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                squareModeEnabled ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  squareModeEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time limit (minutes)
            </label>
            <input
              type="number"
              min={1}
              value={timeValue}
              onChange={(e) => {
                setTimeValue(e.target.value)
                const num = Number(e.target.value)
                if (e.target.value !== '' && !isNaN(num)) onSetTimeLimit(num)
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Predicted idle time (minutes)
            </label>
            <input
              type="number"
              min={0}
              value={idleValue}
              onChange={(e) => {
                setIdleValue(e.target.value)
                const num = Number(e.target.value)
                if (e.target.value !== '' && !isNaN(num)) onSetIdleTime(num)
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Speakers</p>
            <div className="flex flex-col gap-2">
              {names.map((name, idx) => (
                <div key={name} className="flex gap-2 items-center">
                  <input
                    ref={(el) => { inputRefs.current[idx] = el }}
                    type="text"
                    defaultValue={name}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && idx === names.length - 1) onAddName()
                    }}
                    onBlur={(e) => {
                      if (e.target.value !== name) onChangeName(name, e.target.value)
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    aria-label={`Remove ${name}`}
                    onClick={() => onRemoveName(name)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={onAddName}
              className="mt-3 w-full rounded-lg border-2 border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              + Add speaker
            </button>
            <button
              aria-label="Shuffle order"
              onClick={handleShuffleClick}
              disabled={shuffling}
              className={`mt-2 w-full rounded-lg border-2 border-dashed border-gray-300 py-2 text-sm text-gray-500 transition-colors ${
                shuffling ? 'opacity-60 cursor-not-allowed' : 'hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              <span className="inline-block [perspective:600px]">
                <span
                  data-testid="shuffle-dice"
                  className={`inline-block ${shuffling ? 'animate-[dice-spin_0.6s_linear_infinite]' : ''}`}
                >
                  🎲
                </span>
              </span>{' '}
              Shuffle order
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
