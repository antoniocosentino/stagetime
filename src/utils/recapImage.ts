import { formatDateOrdinal } from './date'
import { formatRecapTimeText, computeLegendLayout, type LegendEntry } from './recap'
import type { RenderedSegment } from './segments'
import { formatSeconds } from './time'

export interface RecapImageData {
  date: Date
  usedSeconds: number
  allottedSeconds: number
  segments: RenderedSegment[]
  participants: LegendEntry[]
}

export const RECAP_CANVAS_WIDTH = 1920
export const RECAP_CANVAS_HEIGHT = 1080
export const RECAP_LEGEND_MAX_SLOTS = 24

const MARGIN = 96
const CONTENT_WIDTH = RECAP_CANVAS_WIDTH - MARGIN * 2
const LEGEND_COLUMNS = 3
const LEGEND_ROW_HEIGHT = 64
const BAR_HEIGHT = 64
const GAP_HEADER_TO_BAR = 90
const GAP_BAR_TO_TEXT = 56
const GAP_TEXT_TO_LEGEND = 80
const BOTTOM_PADDING = 40

interface RecapLayout {
  headerBaselineY: number
  barTopY: number
  textBaselineY: number
  legendStartY: number
}

function computeLayout(data: RecapImageData): RecapLayout {
  const { shown, moreCount } = computeLegendLayout(data.participants, RECAP_LEGEND_MAX_SLOTS)
  const legendSlotCount = shown.length + (moreCount > 0 ? 1 : 0)
  const legendRows = Math.max(1, Math.ceil(legendSlotCount / LEGEND_COLUMNS))

  const headerBaselineY = 56
  const barTopY = headerBaselineY + GAP_HEADER_TO_BAR
  const textBaselineY = barTopY + BAR_HEIGHT + GAP_BAR_TO_TEXT
  const legendStartY = textBaselineY + GAP_TEXT_TO_LEGEND
  const totalHeight = legendStartY + legendRows * LEGEND_ROW_HEIGHT + BOTTOM_PADDING

  const top = Math.max(0, (RECAP_CANVAS_HEIGHT - totalHeight) / 2)

  return {
    headerBaselineY: top + headerBaselineY,
    barTopY: top + barTopY,
    textBaselineY: top + textBaselineY,
    legendStartY: top + legendStartY,
  }
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arc(x + w - r, y + r, r, -Math.PI / 2, 0)
  ctx.lineTo(x + w, y + h - r)
  ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2)
  ctx.lineTo(x + r, y + h)
  ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI)
  ctx.lineTo(x, y + r)
  ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5)
  ctx.closePath()
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, RECAP_CANVAS_WIDTH, RECAP_CANVAS_HEIGHT)

  const blobs = [
    { x: RECAP_CANVAS_WIDTH * 0.26, y: RECAP_CANVAS_HEIGHT * 0.8, r: RECAP_CANVAS_WIDTH * 0.5, color: '#5eead4' },
    { x: RECAP_CANVAS_WIDTH * 0.72, y: RECAP_CANVAS_HEIGHT * 0.3, r: RECAP_CANVAS_WIDTH * 0.5, color: '#c4b5fd' },
    { x: RECAP_CANVAS_WIDTH * 0.92, y: RECAP_CANVAS_HEIGHT * 0.1, r: RECAP_CANVAS_WIDTH * 0.4, color: '#fbcfe8' },
  ]

  ctx.save()
  ctx.globalAlpha = 0.45
  for (const blob of blobs) {
    const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r)
    gradient.addColorStop(0, blob.color)
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, RECAP_CANVAS_WIDTH, RECAP_CANVAS_HEIGHT)
  }
  ctx.restore()
}

function drawHeader(ctx: CanvasRenderingContext2D, data: RecapImageData, layout: RecapLayout) {
  ctx.fillStyle = '#1f2937'
  ctx.font = 'bold 56px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(formatDateOrdinal(data.date), RECAP_CANVAS_WIDTH / 2, layout.headerBaselineY)
}

function drawIdleStripes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.fillStyle = '#f9fafb'
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = '#d1d5db'
  ctx.lineWidth = 6
  for (let offset = -h; offset < w + h; offset += 14) {
    ctx.beginPath()
    ctx.moveTo(x + offset, y + h)
    ctx.lineTo(x + offset + h, y)
    ctx.stroke()
  }
  ctx.restore()
}

function drawProgressBar(ctx: CanvasRenderingContext2D, data: RecapImageData, layout: RecapLayout) {
  const trackX = MARGIN
  const trackY = layout.barTopY
  const trackW = CONTENT_WIDTH
  const trackH = BAR_HEIGHT

  ctx.save()
  roundedRectPath(ctx, trackX, trackY, trackW, trackH, trackH / 2)
  ctx.clip()

  ctx.fillStyle = '#e5e7eb'
  ctx.fillRect(trackX, trackY, trackW, trackH)

  const basis = Math.max(data.allottedSeconds, data.usedSeconds, 1)
  let cursorX = trackX
  for (const segment of data.segments) {
    const segWidth = (segment.duration / basis) * trackW
    if (segment.color) {
      ctx.fillStyle = segment.color
      ctx.fillRect(cursorX, trackY, segWidth, trackH)
    } else {
      drawIdleStripes(ctx, cursorX, trackY, segWidth, trackH)
    }
    cursorX += segWidth
  }

  ctx.restore()
}

function drawTimeText(ctx: CanvasRenderingContext2D, data: RecapImageData, layout: RecapLayout) {
  ctx.fillStyle = data.usedSeconds > data.allottedSeconds ? '#dc2626' : '#374151'
  ctx.font = '34px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(
    formatRecapTimeText(data.usedSeconds, data.allottedSeconds),
    RECAP_CANVAS_WIDTH / 2,
    layout.textBaselineY
  )
}

function drawLegendSlot(index: number, legendStartY: number, render: (x: number, y: number) => void) {
  const col = index % LEGEND_COLUMNS
  const row = Math.floor(index / LEGEND_COLUMNS)
  const colWidth = CONTENT_WIDTH / LEGEND_COLUMNS
  const x = MARGIN + col * colWidth
  const y = legendStartY + row * LEGEND_ROW_HEIGHT
  render(x, y)
}

function drawLegend(ctx: CanvasRenderingContext2D, data: RecapImageData, layout: RecapLayout) {
  const { shown, moreCount } = computeLegendLayout(data.participants, RECAP_LEGEND_MAX_SLOTS)

  shown.forEach((entry, i) => {
    drawLegendSlot(i, layout.legendStartY, (x, y) => {
      ctx.fillStyle = entry.color
      ctx.beginPath()
      ctx.arc(x + 16, y + 16, 16, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#1f2937'
      ctx.font = '28px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${entry.name} (${formatSeconds(entry.seconds)})`, x + 44, y + 16)
    })
  })

  if (moreCount > 0) {
    drawLegendSlot(shown.length, layout.legendStartY, (x, y) => {
      ctx.fillStyle = '#6b7280'
      ctx.font = 'italic 28px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(`and ${moreCount} more`, x, y + 16)
    })
  }
}

export function drawRecapImage(ctx: CanvasRenderingContext2D, data: RecapImageData): void {
  const layout = computeLayout(data)
  drawBackground(ctx)
  drawHeader(ctx, data, layout)
  drawProgressBar(ctx, data, layout)
  drawTimeText(ctx, data, layout)
  drawLegend(ctx, data, layout)
}

export function generateRecapImageBlob(
  canvas: HTMLCanvasElement,
  data: RecapImageData
): Promise<Blob> {
  canvas.width = RECAP_CANVAS_WIDTH
  canvas.height = RECAP_CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Canvas 2D context is not available'))

  drawRecapImage(ctx, data)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to generate the recap image'))
    }, 'image/png')
  })
}

interface SaveFilePickerHandle {
  createWritable(): Promise<{ write(data: Blob): Promise<void>; close(): Promise<void> }>
}

interface WindowWithSavePicker {
  showSaveFilePicker?: (options: {
    suggestedName: string
    types: { description: string; accept: Record<string, string[]> }[]
  }) => Promise<SaveFilePickerHandle>
}

export async function saveRecapImage(blob: Blob, filename: string): Promise<void> {
  const picker = (window as unknown as WindowWithSavePicker).showSaveFilePicker

  if (picker) {
    try {
      const handle = await picker({
        suggestedName: filename,
        types: [{ description: 'PNG image', accept: { 'image/png': ['.png'] } }],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      throw err
    }
    return
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
