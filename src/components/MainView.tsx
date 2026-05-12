import { GlobalTimer } from './GlobalTimer'
import { SpeakerCard } from './SpeakerCard'
import { useSettingsStore } from '../stores/settingsStore'
import { useTimerStore } from '../stores/timerStore'
import { timePerSpeaker } from '../utils/time'
import { COLORS } from '../constants/colors'

export function MainView() {
  const { names, timeLimitMinutes } = useSettingsStore()
  const { speakers, segments, activeSegmentStart, startSpeaker, pauseSpeaker, resetSpeaker } =
    useTimerStore()

  const totalSeconds = timeLimitMinutes * 60
  const allotted = names.length > 0 ? timePerSpeaker(timeLimitMinutes, names.length) : totalSeconds
  const totalElapsed = Object.values(speakers).reduce((sum, s) => sum + s.elapsed, 0)

  const colorMap: Record<string, string> = {}
  names.forEach((name, i) => {
    colorMap[name] = COLORS[i % COLORS.length]
  })

  const runningSpeaker = Object.entries(speakers).find(([, s]) => s.running)
  const completedColored = segments.map((seg) => ({ ...seg, color: colorMap[seg.name] ?? '#6b7280' }))
  const coloredSegmentsRaw = runningSpeaker
    ? [
        ...completedColored,
        {
          name: runningSpeaker[0],
          duration:
            runningSpeaker[1].elapsed -
            (activeSegmentStart[runningSpeaker[0]] ?? runningSpeaker[1].elapsed),
          color: colorMap[runningSpeaker[0]] ?? '#6b7280',
        },
      ]
    : completedColored
  const coloredSegments = coloredSegmentsRaw.filter((seg) => seg.duration > 0)

  return (
    <main className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto">
      <GlobalTimer
        totalSeconds={totalSeconds}
        totalElapsed={totalElapsed}
        segments={coloredSegments}
      />
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
              color={colorMap[name]}
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
