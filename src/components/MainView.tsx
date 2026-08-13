import { GlobalTimer } from './GlobalTimer'
import { SpeakerCard } from './SpeakerCard'
import { useSettingsStore } from '../stores/settingsStore'
import { useTimerStore } from '../stores/timerStore'
import { timePerSpeaker } from '../utils/time'
import { buildColorMap, buildRenderedSegments } from '../utils/segments'

export function MainView() {
  const { names, timeLimitMinutes, idleTimeMinutes, squareModeEnabled } = useSettingsStore()
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

  const colorMap = buildColorMap(names)
  const renderedSegments = buildRenderedSegments(
    { segments, globalRunning, globalElapsed, currentSpeaker, activeSegmentStart, idleSegmentStart },
    colorMap
  )

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
              square={squareModeEnabled}
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
