// Spaced Repetition System for toddler learning
// Simplified intervals for short attention spans

export interface CardProgress {
  id: string;
  letter_id: string;
  level: number; // 0-3 stars
  next_review: Date;
  review_count: number;
}

// Intervals in milliseconds
// Level 0: Immediate (new card)
// Level 1: 2 minutes
// Level 2: 10 minutes
// Level 3: 1 hour (mastered)
const INTERVALS = [0, 120000, 600000, 3600000];
const FAIL_INTERVAL = 30000; // 30 seconds after wrong answer

export function calculateNextReview(
  currentLevel: number,
  success: boolean,
): { newLevel: number; nextReview: Date } {
  const now = new Date();

  if (success) {
    const newLevel = Math.min(currentLevel + 1, 3);
    const interval = INTERVALS[newLevel] || 86400000; // Default to 1 day for mastered
    return {
      newLevel,
      nextReview: new Date(now.getTime() + interval),
    };
  } else {
    // Drop one level on failure, but don't go below 0
    const newLevel = Math.max(0, currentLevel - 1);
    return {
      newLevel,
      nextReview: new Date(now.getTime() + FAIL_INTERVAL),
    };
  }
}

export function selectNextCard(cards: CardProgress[]): CardProgress | null {
  if (cards.length === 0) return null;

  const now = new Date();

  // Filter cards that are due for review
  const dueCards = cards.filter((c) => new Date(c.next_review) <= now);

  if (dueCards.length === 0) {
    // No cards due - pick a random unmastered card
    const unmastered = cards.filter((c) => c.level < 3);
    if (unmastered.length === 0) {
      // All mastered - return random card
      return cards[Math.floor(Math.random() * cards.length)];
    }
    return unmastered[Math.floor(Math.random() * unmastered.length)];
  }

  // Prioritize lower levels (cards they don't know yet)
  dueCards.sort((a, b) => a.level - b.level);

  // Take top 3 candidates and pick random to avoid monotony
  const candidates = dueCards.slice(0, 3);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// Initialize progress for all letters (used for new users)
export function initializeProgress(): Omit<CardProgress, "id">[] {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  return alphabet.map((letter) => ({
    letter_id: letter,
    level: 0,
    next_review: new Date(),
    review_count: 0,
  }));
}
