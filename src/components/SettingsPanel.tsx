import { useState, useEffect } from 'react'

interface Props {
  names: string[]
  timeLimitMinutes: number
  onAddName: () => void
  onRemoveName: (name: string) => void
  onChangeName: (oldName: string, newName: string) => void
  onSetTimeLimit: (minutes: number) => void
  onShuffle: () => void
  onClose: () => void
}

export function SettingsPanel({
  names,
  timeLimitMinutes,
  onAddName,
  onRemoveName,
  onChangeName,
  onSetTimeLimit,
  onShuffle,
  onClose,
}: Props) {
  const [timeValue, setTimeValue] = useState(String(timeLimitMinutes))
  useEffect(() => { setTimeValue(String(timeLimitMinutes)) }, [timeLimitMinutes])

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-50" onClick={onClose}>
      <div className="bg-white w-full max-w-sm h-full flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Settings</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
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
            <p className="text-sm font-medium text-gray-700 mb-2">Speakers</p>
            <div className="flex flex-col gap-2">
              {names.map((name) => (
                <div key={name} className="flex gap-2 items-center">
                  <input
                    type="text"
                    defaultValue={name}
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
              onClick={onShuffle}
              className="mt-2 w-full rounded-lg border-2 border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              🎲 Shuffle order
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
