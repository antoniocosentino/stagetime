import { useEffect, useState } from 'react'
import { useSettingsStore } from './stores/settingsStore'
import { useTimerStore } from './stores/timerStore'
import { useInterval } from './hooks/useInterval'
import { TopBar } from './components/TopBar'
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
      <TopBar onOpenSettings={() => setSettingsOpen(true)} />
      <MainView />
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
