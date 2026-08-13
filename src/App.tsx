import { useEffect, useState } from 'react'
import { useSettingsStore } from './stores/settingsStore'
import { useTimerStore } from './stores/timerStore'
import { useInterval } from './hooks/useInterval'
import { MainView } from './components/MainView'
import { SettingsPanel } from './components/SettingsPanel'
import { SquareModeIndicator } from './components/SquareModeIndicator'
import { Dice3D } from './components/Dice3D'
import { useShuffleAnimation } from './hooks/useShuffleAnimation'
import { buildColorMap, buildRenderedSegments } from './utils/segments'
import { generateRecapImageBlob, saveRecapImage } from './utils/recapImage'
import { formatFilenameTimestamp } from './utils/date'

function DownloadIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 19h16" />
    </svg>
  )
}

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const names = useSettingsStore((s) => s.names)
  const globalElapsed = useTimerStore((s) => s.globalElapsed)
  const {
    setNames,
    addName,
    removeName,
    setTimeLimitMinutes,
    setIdleTimeMinutes,
    timeLimitMinutes,
    idleTimeMinutes,
    squareModeEnabled,
    setSquareModeEnabled,
    shuffleNames,
  } = useSettingsStore()
  const { shuffling, trigger: handleShuffle } = useShuffleAnimation(shuffleNames)

  useEffect(() => {
    const { speakers, addSpeaker, removeSpeaker } = useTimerStore.getState()
    names.forEach((name) => {
      if (!(name in speakers)) addSpeaker(name)
    })
    Object.keys(speakers).forEach((key) => {
      if (!names.includes(key)) removeSpeaker(key)
    })
  }, [names])

  useInterval(() => {
    useTimerStore.getState().tick()
  }, 100)

  function handleChangeName(oldName: string, newName: string) {
    setNames(names.map((n) => (n === oldName ? newName : n)))
  }

  async function handleExportRecap() {
    setExporting(true)
    try {
      const timerState = useTimerStore.getState()
      const colorMap = buildColorMap(names)
      const renderedSegments = buildRenderedSegments(
        {
          segments: timerState.segments,
          globalRunning: timerState.globalRunning,
          globalElapsed: timerState.globalElapsed,
          currentSpeaker: timerState.currentSpeaker,
          activeSegmentStart: timerState.activeSegmentStart,
          idleSegmentStart: timerState.idleSegmentStart,
        },
        colorMap
      )
      const now = new Date()
      const canvas = document.createElement('canvas')
      const blob = await generateRecapImageBlob(canvas, {
        date: now,
        usedSeconds: timerState.globalElapsed,
        allottedSeconds: timeLimitMinutes * 60,
        segments: renderedSegments,
        participants: names.map((name) => ({
          name,
          color: colorMap[name],
          seconds: timerState.speakers[name]?.elapsed ?? 0,
        })),
      })
      await saveRecapImage(blob, `stagetime-recap-${formatFilenameTimestamp(now)}.png`)
    } catch (err) {
      console.error('Failed to export recap image', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MainView />
      <button
        aria-label="Open settings"
        onClick={() => setSettingsOpen(true)}
        disabled={shuffling}
        className={`fixed bottom-6 right-6 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-xl transition-all ${
          shuffling ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        ⚙
      </button>
      {!settingsOpen && (
        <button
          aria-label="Shuffle order"
          onClick={handleShuffle}
          disabled={shuffling}
          className={`fixed bottom-6 right-20 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl transition-all ${
            shuffling ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <Dice3D size={17} spinning={shuffling} />
        </button>
      )}
      {!settingsOpen && globalElapsed > 0 && (
        <button
          aria-label="Export recap"
          onClick={handleExportRecap}
          disabled={shuffling || exporting}
          className={`fixed bottom-6 right-34 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-xl transition-all ${
            shuffling || exporting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <DownloadIcon size={18} />
        </button>
      )}
      {shuffling && !settingsOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 pointer-events-none">
          <Dice3D size={140} />
        </div>
      )}
      {squareModeEnabled && <SquareModeIndicator />}
      {settingsOpen && (
        <SettingsPanel
          names={names}
          timeLimitMinutes={timeLimitMinutes}
          idleTimeMinutes={idleTimeMinutes}
          squareModeEnabled={squareModeEnabled}
          onAddName={() => addName(`Speaker ${names.length + 1}`)}
          onRemoveName={removeName}
          onChangeName={handleChangeName}
          onSetTimeLimit={setTimeLimitMinutes}
          onSetIdleTime={setIdleTimeMinutes}
          onToggleSquareMode={() => setSquareModeEnabled(!squareModeEnabled)}
          onShuffle={shuffleNames}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
