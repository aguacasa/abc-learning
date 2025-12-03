import { Letter } from './letters'

export type DeckId = 'uppercase' | 'lowercase' | 'mixed'

export interface Deck {
  id: DeckId
  name: string
  description: string
  icon: string
  letterCount: number
}

export const decks: Deck[] = [
  {
    id: 'uppercase',
    name: 'Uppercase Letters',
    description: 'Learn A B C to Z',
    icon: 'ABC',
    letterCount: 26,
  },
  {
    id: 'lowercase',
    name: 'Lowercase Letters',
    description: 'Learn a b c to z',
    icon: 'abc',
    letterCount: 26,
  },
  {
    id: 'mixed',
    name: 'All Letters',
    description: 'Both Aa Bb Cc to Zz',
    icon: 'AaBb',
    letterCount: 52,
  },
]

export function getDeckById(id: DeckId): Deck | undefined {
  return decks.find((d) => d.id === id)
}

// Base letter data used to generate deck-specific letters
const baseLetterData = [
  { letter: 'A', word: 'Apple' },
  { letter: 'B', word: 'Ball' },
  { letter: 'C', word: 'Cat' },
  { letter: 'D', word: 'Dog' },
  { letter: 'E', word: 'Elephant' },
  { letter: 'F', word: 'Fish' },
  { letter: 'G', word: 'Guitar' },
  { letter: 'H', word: 'Hat' },
  { letter: 'I', word: 'Igloo' },
  { letter: 'J', word: 'Juice' },
  { letter: 'K', word: 'Kite' },
  { letter: 'L', word: 'Lion' },
  { letter: 'M', word: 'Moon' },
  { letter: 'N', word: 'Nest' },
  { letter: 'O', word: 'Octopus' },
  { letter: 'P', word: 'Pig' },
  { letter: 'Q', word: 'Queen' },
  { letter: 'R', word: 'Rainbow' },
  { letter: 'S', word: 'Sun' },
  { letter: 'T', word: 'Turtle' },
  { letter: 'U', word: 'Umbrella' },
  { letter: 'V', word: 'Violin' },
  { letter: 'W', word: 'Whale' },
  { letter: 'X', word: 'X-Ray' },
  { letter: 'Y', word: 'Yo-Yo' },
  { letter: 'Z', word: 'Zebra' },
]

function createUppercaseLetter(data: { letter: string; word: string }): Letter {
  return {
    id: data.letter,
    display: data.letter,
    back: data.letter,
    word: data.word,
    sound: `${data.letter} is for ${data.word}`,
  }
}

function createLowercaseLetter(data: { letter: string; word: string }): Letter {
  const lower = data.letter.toLowerCase()
  return {
    id: `${lower}_lower`,
    display: lower,
    back: lower,
    word: data.word,
    sound: `${lower} is for ${data.word}`,
  }
}

export function getLettersForDeck(deckId: DeckId): Letter[] {
  switch (deckId) {
    case 'uppercase':
      return baseLetterData.map(createUppercaseLetter)
    case 'lowercase':
      return baseLetterData.map(createLowercaseLetter)
    case 'mixed':
      return [
        ...baseLetterData.map(createUppercaseLetter),
        ...baseLetterData.map(createLowercaseLetter),
      ]
    default:
      return baseLetterData.map(createUppercaseLetter)
  }
}
