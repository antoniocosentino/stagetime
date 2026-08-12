interface Props {
  size: number
  spinning?: boolean
}

const PIP_LAYOUTS: Record<number, [number, number][]> = {
  1: [[2, 2]],
  2: [[1, 1], [3, 3]],
  3: [[1, 1], [2, 2], [3, 3]],
  4: [[1, 1], [1, 3], [3, 1], [3, 3]],
  5: [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3]],
  6: [[1, 1], [1, 3], [2, 1], [2, 3], [3, 1], [3, 3]],
}

function DiceFace({ value, transform }: { value: number; transform: string }) {
  return (
    <div className="absolute inset-0" style={{ transform, transformStyle: 'preserve-3d' }}>
      <div
        className="absolute inset-0 rounded-[12%] border border-gray-300 bg-white"
        style={{ transform: 'translateZ(-1px)' }}
      />
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-[14%]">
        {PIP_LAYOUTS[value].map(([row, col], i) => (
          <span
            key={i}
            className="rounded-full bg-gray-800"
            style={{ gridRow: row, gridColumn: col, alignSelf: 'center', justifySelf: 'center', width: '55%', height: '55%' }}
          />
        ))}
      </div>
    </div>
  )
}

export function Dice3D({ size, spinning = true }: Props) {
  const half = size / 2
  return (
    <div data-testid="dice-3d" className="relative" style={{ width: size, height: size, perspective: 600 }}>
      <div
        className={`relative w-full h-full ${spinning ? 'dice-cube' : ''}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <DiceFace value={1} transform={`translateZ(${half}px)`} />
        <DiceFace value={6} transform={`rotateY(180deg) translateZ(${half}px)`} />
        <DiceFace value={3} transform={`rotateY(90deg) translateZ(${half}px)`} />
        <DiceFace value={4} transform={`rotateY(-90deg) translateZ(${half}px)`} />
        <DiceFace value={2} transform={`rotateX(90deg) translateZ(${half}px)`} />
        <DiceFace value={5} transform={`rotateX(-90deg) translateZ(${half}px)`} />
      </div>
    </div>
  )
}
