import { GlobalTimer } from './GlobalTimer'
import type { RenderedSegment } from './GlobalTimer'
import { SpeakerCard } from './SpeakerCard'
import { useSettingsStore } from '../stores/settingsStore'
import { useTimerStore } from '../stores/timerStore'
import { timePerSpeaker } from '../utils/time'
import { COLORS } from '../constants/colors'

export function MainView() {
  const { names, timeLimitMinutes, idleTimeMinutes } = useSettingsStore()
  const {
    speakers,
    segments,
    globalRunning,
    globalElapsed,
    currentSpeaker,
    activeSegmentStart,
    idleSegmentStart,
    startGlobal,
    pauseGlobal,
    resetAll,
    setCurrentSpeaker,
  } = useTimerStore()

  const totalSeconds = timeLimitMinutes * 60
  const allotted =
    names.length > 0
      ? timePerSpeaker(timeLimitMinutes, idleTimeMinutes, names.length)
      : totalSeconds

  const colorMap: Record<string, string> = {}
  names.forEach((name, i) => {
    colorMap[name] = COLORS[i % COLORS.length]
  })

  const renderedSegments: RenderedSegment[] = segments.map((seg) =>
    seg.type === 'idle'
      ? { duration: seg.duration }
      : { duration: seg.duration, color: colorMap[seg.name] ?? '#6b7280' }
  )

  if (globalRunning) {
    if (currentSpeaker !== null && activeSegmentStart !== null) {
      const duration = globalElapsed - activeSegmentStart
      if (duration > 0) {
        renderedSegments.push({ duration, color: colorMap[currentSpeaker] ?? '#6b7280' })
      }
    } else if (currentSpeaker === null && idleSegmentStart !== null) {
      const duration = globalElapsed - idleSegmentStart
      if (duration > 0) {
        renderedSegments.push({ duration })
      }
    }
  }

  return (
    <main className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto">
      <GlobalTimer
        totalSeconds={totalSeconds}
        globalElapsed={globalElapsed}
        globalRunning={globalRunning}
        segments={renderedSegments}
        onStart={startGlobal}
        onPause={pauseGlobal}
        onReset={resetAll}
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
              isCurrentSpeaker={currentSpeaker === name}
              allottedSeconds={allotted}
              color={colorMap[name]}
              onSelect={
                globalRunning
                  ? () => setCurrentSpeaker(currentSpeaker === name ? null : name)
                  : undefined
              }
            />
          )
        })}
      </div>
    </main>
  )
}
