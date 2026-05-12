import { GlobalTimer } from './GlobalTimer'
import { SpeakerCard } from './SpeakerCard'
import { useSettingsStore } from '../stores/settingsStore'
import { useTimerStore } from '../stores/timerStore'
import { timePerSpeaker } from '../utils/time'

export function MainView() {
  const { names, timeLimitMinutes } = useSettingsStore()
  const { speakers, startSpeaker, pauseSpeaker, resetSpeaker } = useTimerStore()

  const totalSeconds = timeLimitMinutes * 60
  const allotted = names.length > 0 ? timePerSpeaker(timeLimitMinutes, names.length) : totalSeconds
  const totalElapsed = Object.values(speakers).reduce((sum, s) => sum + s.elapsed, 0)

  return (
    <main className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto">
      <GlobalTimer totalSeconds={totalSeconds} totalElapsed={totalElapsed} segments={[]} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {names.map((name) => {
          const speaker = speakers[name]
          if (!speaker) return null
          return (
            <SpeakerCard
              key={name}
              name={name}
              elapsed={speaker.elapsed}
              running={speaker.running}
              allottedSeconds={allotted}
              onStart={() => startSpeaker(name)}
              onPause={() => pauseSpeaker(name)}
              onReset={() => resetSpeaker(name)}
            />
          )
        })}
      </div>
    </main>
  )
}
