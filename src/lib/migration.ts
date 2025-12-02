import { SupabaseClient } from '@supabase/supabase-js'

interface OldAppState {
  cards: {
    id: string
    level: number
    nextReview: number
    interval: number
  }[]
  totalStars: number
  currentCardIndex: number | null
  isFlipped: boolean
}

const LOCAL_STORAGE_KEY = 'toddlerABC_v1'
const MIGRATION_FLAG_KEY = 'toddlerABC_migrated'

export async function migrateFromLocalStorage(
  supabase: SupabaseClient,
  userId: string
): Promise<{ migrated: boolean; starsImported: number; lettersImported: number }> {
  // Check if already migrated
  if (typeof window === 'undefined') {
    return { migrated: false, starsImported: 0, lettersImported: 0 }
  }

  const migrationFlag = localStorage.getItem(MIGRATION_FLAG_KEY)
  if (migrationFlag === 'true') {
    return { migrated: false, starsImported: 0, lettersImported: 0 }
  }

  // Get old data
  const oldDataStr = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (!oldDataStr) {
    return { migrated: false, starsImported: 0, lettersImported: 0 }
  }

  try {
    const oldData: OldAppState = JSON.parse(oldDataStr)

    // Check if there's any progress worth migrating
    const hasProgress = oldData.cards.some((c) => c.level > 0) || oldData.totalStars > 0
    if (!hasProgress) {
      localStorage.setItem(MIGRATION_FLAG_KEY, 'true')
      return { migrated: false, starsImported: 0, lettersImported: 0 }
    }

    // Migrate card progress
    for (const card of oldData.cards) {
      await supabase
        .from('card_progress')
        .upsert({
          user_id: userId,
          letter_id: card.id,
          level: card.level,
          next_review: new Date(card.nextReview).toISOString(),
          review_count: card.level, // Approximate based on level
        }, {
          onConflict: 'user_id,letter_id',
        })
    }

    // Migrate total stars
    if (oldData.totalStars > 0) {
      await supabase
        .from('user_stats')
        .upsert({
          user_id: userId,
          total_stars: oldData.totalStars,
          last_played_at: new Date().toISOString(),
        })
    }

    // Mark as migrated
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true')

    const lettersWithProgress = oldData.cards.filter((c) => c.level > 0).length

    return {
      migrated: true,
      starsImported: oldData.totalStars,
      lettersImported: lettersWithProgress,
    }
  } catch (error) {
    console.error('Migration failed:', error)
    return { migrated: false, starsImported: 0, lettersImported: 0 }
  }
}

export function clearMigrationFlag(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(MIGRATION_FLAG_KEY)
  }
}
