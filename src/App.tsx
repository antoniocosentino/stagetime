import { useEffect, useState } from 'react'
import { useSettingsStore } from './stores/settingsStore'
import { useTimerStore } from './stores/timerStore'
import { useInterval } from './hooks/useInterval'
import { MainView } from './components/MainView'
import { SettingsPanel } from './components/SettingsPanel'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const names = useSettingsStore((s) => s.names)
  const { setNames, addName, removeName, setTimeLimitMinutes, timeLimitMinutes } = useSettingsStore()

  // Reconcile timer store entries with the current names list.
  // Reads timer state via getState() to avoid subscribing to every tick.
  useEffect(() => {
    const { speakers, addSpeaker, removeSpeaker } = useTimerStore.getState()
    names.forEach((name) => {
      if (!(name in speakers)) addSpeaker(name)
    })
    Object.keys(speakers).forEach((key) => {
      if (!names.includes(key)) removeSpeaker(key)
    })
  }, [names])

  // Single shared tick for all running timers.
  useInterval(() => {
    useTimerStore.getState().tickRunning(0.1)
  }, 100)

  function handleChangeName(oldName: string, newName: string) {
    setNames(names.map((n) => (n === oldName ? newName : n)))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MainView />
      <button
        aria-label="Open settings"
        onClick={() => setSettingsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-xl transition-all"
      >
        ⚙
      </button>
      {settingsOpen && (
        <SettingsPanel
          names={names}
          timeLimitMinutes={timeLimitMinutes}
          onAddName={() => addName(`Speaker ${names.length + 1}`)}
          onRemoveName={removeName}
          onChangeName={handleChangeName}
          onSetTimeLimit={setTimeLimitMinutes}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
