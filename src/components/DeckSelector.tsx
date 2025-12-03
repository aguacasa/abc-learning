'use client'

import { decks, DeckId } from '@/lib/decks'

interface DeckSelectorProps {
  onSelectDeck: (deckId: DeckId) => void
}

export function DeckSelector({ onSelectDeck }: DeckSelectorProps) {
  return (
    <div className="w-full space-y-3">
      <p
        className="text-center text-lg font-bold mb-4"
        style={{ fontFamily: "'Fredoka One', cursive", color: '#5FD3BC' }}
      >
        Choose a Pack
      </p>
      {decks.map((deck) => (
        <button
          key={deck.id}
          onClick={() => onSelectDeck(deck.id)}
          className="w-full p-4 rounded-2xl bg-white border-2 border-[#A0C4FF] hover:border-[#5FD3BC] hover:bg-[#F0FBF9] text-left cursor-pointer transition-all active:scale-[0.98] flex items-center gap-4"
        >
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{
              fontFamily: "'Fredoka One', cursive",
              backgroundColor: getDeckColor(deck.id),
            }}
          >
            {deck.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="font-bold text-lg truncate"
              style={{ fontFamily: "'Fredoka One', cursive", color: '#333' }}
            >
              {deck.name}
            </div>
            <div className="text-gray-500 text-sm">{deck.description}</div>
            <div className="text-gray-400 text-xs mt-1">
              {deck.letterCount} cards
            </div>
          </div>
          <div className="text-[#A0C4FF] text-2xl shrink-0">→</div>
        </button>
      ))}
    </div>
  )
}

function getDeckColor(deckId: DeckId): string {
  switch (deckId) {
    case 'uppercase':
      return '#FF8BA7'
    case 'lowercase':
      return '#5FD3BC'
    case 'mixed':
      return '#A0C4FF'
    default:
      return '#FF8BA7'
  }
}
