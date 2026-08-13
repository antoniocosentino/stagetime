import {
  drawRecapImage,
  generateRecapImageBlob,
  saveRecapImage,
  RECAP_CANVAS_WIDTH,
  RECAP_CANVAS_HEIGHT,
  RECAP_LEGEND_MAX_SLOTS,
  type RecapImageData,
} from './recapImage'
import { formatDateOrdinal } from './date'
import { formatRecapTimeText } from './recap'
import { formatSeconds } from './time'

function createFakeCtx() {
  const fillStyleHistory: unknown[] = []
  const fillTextCalls: { text: string; x: number; y: number }[] = []
  const ctx = {
    fillRect: vi.fn(),
    fillText: vi.fn((text: string, x: number, y: number) => {
      fillTextCalls.push({ text, x, y })
    }),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    rect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    clip: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    measureText: vi.fn(() => ({ width: 100 })),
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    globalAlpha: 1,
  }
  Object.defineProperty(ctx, 'fillStyle', {
    get: () => fillStyleHistory[fillStyleHistory.length - 1],
    set: (v) => { fillStyleHistory.push(v) },
  })
  return { ctx: ctx as unknown as CanvasRenderingContext2D, fillStyleHistory, fillTextCalls }
}

function baseData(overrides: Partial<RecapImageData> = {}): RecapImageData {
  return {
    date: new Date(2026, 7, 13),
    usedSeconds: 300,
    allottedSeconds: 900,
    segments: [
      { duration: 200, color: '#3b82f6' },
      { duration: 100, color: '#22c55e' },
    ],
    participants: [
      { name: 'Alice', color: '#3b82f6', seconds: 172 },
      { name: 'Bob', color: '#22c55e', seconds: 88 },
    ],
    ...overrides,
  }
}

describe('drawRecapImage', () => {
  it('fills the full canvas with a background before drawing anything else', () => {
    const { ctx } = createFakeCtx()
    drawRecapImage(ctx, baseData())
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, RECAP_CANVAS_WIDTH, RECAP_CANVAS_HEIGHT)
  })

  it('draws the formatted date as header text', () => {
    const { ctx, fillTextCalls } = createFakeCtx()
    const data = baseData()
    drawRecapImage(ctx, data)
    expect(fillTextCalls.map((c) => c.text)).toContain(formatDateOrdinal(data.date))
  })

  it('draws the used/allocated time recap text', () => {
    const { ctx, fillTextCalls } = createFakeCtx()
    const data = baseData({ usedSeconds: 945, allottedSeconds: 900 })
    drawRecapImage(ctx, data)
    expect(fillTextCalls.map((c) => c.text)).toContain(
      formatRecapTimeText(data.usedSeconds, data.allottedSeconds)
    )
  })

  it('sets fillStyle to each segment color while drawing the progress bar', () => {
    const { ctx, fillStyleHistory } = createFakeCtx()
    drawRecapImage(ctx, baseData())
    expect(fillStyleHistory).toContain('#3b82f6')
    expect(fillStyleHistory).toContain('#22c55e')
  })

  it('draws each participant name with their talking time in the legend', () => {
    const { ctx, fillTextCalls } = createFakeCtx()
    drawRecapImage(ctx, baseData())
    const texts = fillTextCalls.map((c) => c.text)
    expect(texts).toContain(`Alice (${formatSeconds(172)})`)
    expect(texts).toContain(`Bob (${formatSeconds(88)})`)
  })

  it('shows an "and N more" caption when participants exceed the legend capacity', () => {
    const { ctx, fillTextCalls } = createFakeCtx()
    const many = Array.from({ length: RECAP_LEGEND_MAX_SLOTS + 5 }, (_, i) => ({
      name: `Speaker ${i}`,
      color: '#3b82f6',
      seconds: i,
    }))
    drawRecapImage(ctx, baseData({ participants: many }))
    const texts = fillTextCalls.map((c) => c.text)
    expect(texts).toContain('and 6 more')
    const lastIndex = RECAP_LEGEND_MAX_SLOTS + 4
    expect(texts).not.toContain(`Speaker ${lastIndex} (${formatSeconds(lastIndex)})`)
  })
})

describe('generateRecapImageBlob', () => {
  function createFakeCanvas(ctx: CanvasRenderingContext2D) {
    let blobCallback: ((blob: Blob | null) => void) | null = null
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctx),
      toBlob: vi.fn((cb: (blob: Blob | null) => void) => {
        blobCallback = cb
        cb(new Blob(['fake-png-bytes'], { type: 'image/png' }))
      }),
    }
    return { canvas: canvas as unknown as HTMLCanvasElement, getBlobCallback: () => blobCallback }
  }

  it('sizes the canvas to the recap dimensions and resolves with the produced blob', async () => {
    const { ctx } = createFakeCtx()
    const { canvas } = createFakeCanvas(ctx)
    const blob = await generateRecapImageBlob(canvas, baseData())
    expect(canvas.width).toBe(RECAP_CANVAS_WIDTH)
    expect(canvas.height).toBe(RECAP_CANVAS_HEIGHT)
    expect(blob).toBeInstanceOf(Blob)
  })

  it('rejects when the canvas cannot produce a 2d context', async () => {
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => null),
      toBlob: vi.fn(),
    } as unknown as HTMLCanvasElement
    await expect(generateRecapImageBlob(canvas, baseData())).rejects.toThrow()
  })
})

describe('saveRecapImage', () => {
  const blob = new Blob(['fake-png-bytes'], { type: 'image/png' })
  const filename = 'stagetime-recap-2026-08-13.png'

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).showSaveFilePicker
    vi.unstubAllGlobals()
  })

  it('writes the blob through the File System Access API when available', async () => {
    const write = vi.fn()
    const close = vi.fn()
    const createWritable = vi.fn(async () => ({ write, close }))
    const showSaveFilePicker = vi.fn(async () => ({ createWritable }))
    ;(window as unknown as Record<string, unknown>).showSaveFilePicker = showSaveFilePicker

    await saveRecapImage(blob, filename)

    expect(showSaveFilePicker).toHaveBeenCalledWith(
      expect.objectContaining({ suggestedName: filename })
    )
    expect(write).toHaveBeenCalledWith(blob)
    expect(close).toHaveBeenCalled()
  })

  it('silently does nothing when the user cancels the save picker', async () => {
    const abortError = new DOMException('cancelled', 'AbortError')
    ;(window as unknown as Record<string, unknown>).showSaveFilePicker = vi.fn(async () => {
      throw abortError
    })

    await expect(saveRecapImage(blob, filename)).resolves.toBeUndefined()
  })

  it('falls back to a download link when the File System Access API is unavailable', async () => {
    const createObjectURL = vi.fn(() => 'blob:fake-url')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    await saveRecapImage(blob, filename)

    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(click).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url')

    click.mockRestore()
  })
})
