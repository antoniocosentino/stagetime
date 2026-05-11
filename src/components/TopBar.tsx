interface Props {
  onOpenSettings: () => void
}

export function TopBar({ onOpenSettings }: Props) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
      <h1 className="font-bold text-gray-900 text-lg">stagetime</h1>
      <button
        aria-label="Open settings"
        onClick={onOpenSettings}
        className="text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-lg hover:bg-gray-100"
      >
        ⚙
      </button>
    </header>
  )
}
