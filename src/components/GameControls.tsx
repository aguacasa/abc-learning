'use client'

interface GameControlsProps {
  visible: boolean
  onHard: () => void
  onEasy: () => void
}

export function GameControls({ visible, onHard, onEasy }: GameControlsProps) {
  return (
    <div
      className={`flex gap-5 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <button
        onClick={onHard}
        className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg text-white bg-[#FF8BA7] shadow-[0_5px_0_rgba(0,0,0,0.1)] active:scale-95 active:shadow-[0_2px_0_rgba(0,0,0,0.1)] transition-transform cursor-pointer border-none"
        style={{ fontFamily: "'Fredoka One', cursive" }}
      >
        <span>🤔</span> Let&apos;s Try Again
      </button>
      <button
        onClick={onEasy}
        className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg text-white bg-[#5FD3BC] shadow-[0_5px_0_rgba(0,0,0,0.1)] active:scale-95 active:shadow-[0_2px_0_rgba(0,0,0,0.1)] transition-transform cursor-pointer border-none"
        style={{ fontFamily: "'Fredoka One', cursive" }}
      >
        <span>🤩</span> I Know It!
      </button>
    </div>
  )
}
