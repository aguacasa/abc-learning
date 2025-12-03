'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { letters, Letter } from '@/lib/letters'
import { calculateNextReview, selectNextCard, CardProgress } from '@/lib/srs'
import { speak } from '@/lib/speech'
import { migrateFromLocalStorage } from '@/lib/migration'
import { getNewAchievements, Achievement } from '@/lib/achievements'

const GUEST_PROGRESS_KEY = 'abc_guest_progress'
const GUEST_STATS_KEY = 'abc_guest_stats'
const GUEST_ACHIEVEMENTS_KEY = 'abc_guest_achievements'

interface GuestProgress {
  cards: CardProgress[]
  totalStars: number
  achievements: string[]
}

function loadGuestProgress(): GuestProgress {
  if (typeof window === 'undefined') {
    return { cards: [], totalStars: 0, achievements: [] }
  }

  const savedProgress = localStorage.getItem(GUEST_PROGRESS_KEY)
  const savedStats = localStorage.getItem(GUEST_STATS_KEY)
  const savedAchievements = localStorage.getItem(GUEST_ACHIEVEMENTS_KEY)

  let cards: CardProgress[] = []
  if (savedProgress) {
    try {
      const parsed = JSON.parse(savedProgress)
      cards = parsed.map((p: CardProgress & { next_review: string }) => ({
        ...p,
        next_review: new Date(p.next_review),
      }))
    } catch {
      cards = []
    }
  }

  // Initialize cards if empty
  if (cards.length === 0) {
    cards = letters.map((l) => ({
      id: l.id,
      letter_id: l.id,
      level: 0,
      next_review: new Date(),
      review_count: 0,
    }))
    localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(cards))
  }

  const totalStars = savedStats ? parseInt(savedStats, 10) || 0 : 0
  const achievements = savedAchievements ? JSON.parse(savedAchievements) : []

  return { cards, totalStars, achievements }
}

function saveGuestProgress(cards: CardProgress[], totalStars: number, achievements: string[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(cards))
  localStorage.setItem(GUEST_STATS_KEY, totalStars.toString())
  localStorage.setItem(GUEST_ACHIEVEMENTS_KEY, JSON.stringify(achievements))
}

interface GameState {
  currentLetter: Letter | null
  currentProgress: CardProgress | null
  isFlipped: boolean
  isLoading: boolean
  totalStars: number
  allProgress: CardProgress[]
  isGuest: boolean
}

export function useGameState() {
  const [state, setState] = useState<GameState>({
    currentLetter: null,
    currentProgress: null,
    isFlipped: false,
    isLoading: true,
    totalStars: 0,
    allProgress: [],
    isGuest: true,
  })
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null)
  const [guestAchievements, setGuestAchievements] = useState<string[]>([])
  const hasMigrated = useRef(false)
  const supabase = createClient()

  // Try to migrate from localStorage on first load
  const tryMigration = useCallback(async (userId: string) => {
    if (hasMigrated.current) return
    hasMigrated.current = true

    const result = await migrateFromLocalStorage(supabase, userId)
    if (result.migrated) {
      console.log(`Migrated ${result.starsImported} stars and ${result.lettersImported} letters from local storage`)
    }
  }, [supabase])

  // Load progress from Supabase or localStorage for guests
  const loadProgress = useCallback(async (): Promise<{ cards: CardProgress[], isGuest: boolean, guestAchievements: string[] }> => {
    const { data: { user } } = await supabase.auth.getUser()

    // Guest mode - use localStorage
    if (!user) {
      const guestData = loadGuestProgress()
      setGuestAchievements(guestData.achievements)
      return { cards: guestData.cards, isGuest: true, guestAchievements: guestData.achievements }
    }

    // Authenticated user - use Supabase
    // Try migration first (from old localStorage AND from guest progress)
    await tryMigration(user.id)
    await migrateGuestToUser(user.id)

    const { data: progress } = await supabase
      .from('card_progress')
      .select('*')
      .eq('user_id', user.id)

    if (progress && progress.length > 0) {
      return {
        cards: progress.map((p) => ({
          id: p.id,
          letter_id: p.letter_id,
          level: p.level,
          next_review: new Date(p.next_review),
          review_count: p.review_count,
        })),
        isGuest: false,
        guestAchievements: [],
      }
    }

    // Initialize progress for new user
    const initialProgress = letters.map((l) => ({
      id: '', // Will be set by DB
      letter_id: l.id,
      level: 0,
      next_review: new Date(),
      review_count: 0,
    }))

    // Insert initial progress
    const { data: inserted } = await supabase
      .from('card_progress')
      .insert(
        initialProgress.map((p) => ({
          user_id: user.id,
          letter_id: p.letter_id,
          level: p.level,
          next_review: p.next_review.toISOString(),
          review_count: p.review_count,
        }))
      )
      .select()

    if (inserted) {
      return {
        cards: inserted.map((p) => ({
          id: p.id,
          letter_id: p.letter_id,
          level: p.level,
          next_review: new Date(p.next_review),
          review_count: p.review_count,
        })),
        isGuest: false,
        guestAchievements: [],
      }
    }

    return { cards: initialProgress, isGuest: false, guestAchievements: [] }
  }, [supabase])

  // Migrate guest progress to authenticated user
  const migrateGuestToUser = useCallback(async (userId: string) => {
    const guestProgress = localStorage.getItem(GUEST_PROGRESS_KEY)
    const guestStats = localStorage.getItem(GUEST_STATS_KEY)
    const guestAchievementsData = localStorage.getItem(GUEST_ACHIEVEMENTS_KEY)

    if (!guestProgress && !guestStats) return // No guest data to migrate

    try {
      // Migrate card progress
      if (guestProgress) {
        const cards = JSON.parse(guestProgress) as CardProgress[]
        for (const card of cards) {
          if (card.level > 0 || card.review_count > 0) {
            await supabase
              .from('card_progress')
              .upsert({
                user_id: userId,
                letter_id: card.letter_id,
                level: card.level,
                next_review: new Date(card.next_review).toISOString(),
                review_count: card.review_count,
              }, { onConflict: 'user_id,letter_id' })
          }
        }
      }

      // Migrate stars
      if (guestStats) {
        const totalStars = parseInt(guestStats, 10) || 0
        if (totalStars > 0) {
          await supabase
            .from('user_stats')
            .upsert({
              user_id: userId,
              total_stars: totalStars,
              last_played_at: new Date().toISOString(),
            })
        }
      }

      // Migrate achievements
      if (guestAchievementsData) {
        const achievements = JSON.parse(guestAchievementsData) as string[]
        for (const achievementKey of achievements) {
          await supabase
            .from('user_achievements')
            .upsert({
              user_id: userId,
              achievement_key: achievementKey,
            }, { onConflict: 'user_id,achievement_key' })
        }
      }

      // Clear guest data after successful migration
      localStorage.removeItem(GUEST_PROGRESS_KEY)
      localStorage.removeItem(GUEST_STATS_KEY)
      localStorage.removeItem(GUEST_ACHIEVEMENTS_KEY)

      console.log('Migrated guest progress to authenticated user')
    } catch (error) {
      console.error('Error migrating guest progress:', error)
    }
  }, [supabase])

  // Load stats
  const loadStats = useCallback(async (isGuest: boolean) => {
    if (isGuest) {
      const guestStats = localStorage.getItem(GUEST_STATS_KEY)
      return guestStats ? parseInt(guestStats, 10) || 0 : 0
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { data: stats } = await supabase
      .from('user_stats')
      .select('total_stars')
      .eq('user_id', user.id)
      .single()

    return stats?.total_stars || 0
  }, [supabase])

  // Load next card
  const loadNextCard = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, isFlipped: false }))

    const { cards: progress, isGuest, guestAchievements: loadedGuestAchievements } = await loadProgress()
    const totalStars = await loadStats(isGuest)
    const nextCard = selectNextCard(progress)

    if (loadedGuestAchievements) {
      setGuestAchievements(loadedGuestAchievements)
    }

    if (nextCard) {
      const letter = letters.find((l) => l.id === nextCard.letter_id)
      setState({
        currentLetter: letter || letters[0],
        currentProgress: nextCard,
        isFlipped: false,
        isLoading: false,
        totalStars,
        allProgress: progress,
        isGuest,
      })

      // Speak letter after delay
      setTimeout(() => {
        if (letter) speak(letter.display)
      }, 500)
    } else {
      setState((s) => ({ ...s, isLoading: false, isGuest }))
    }
  }, [loadProgress, loadStats])

  // Flip the card
  const flipCard = useCallback(() => {
    if (state.isFlipped) return

    setState((s) => ({ ...s, isFlipped: true }))

    if (state.currentLetter) {
      speak(state.currentLetter.sound)
    }
  }, [state.isFlipped, state.currentLetter])

  // Handle result (correct/incorrect)
  const handleResult = useCallback(
    async (success: boolean) => {
      if (!state.isFlipped || !state.currentProgress || !state.currentLetter) return

      const { newLevel, nextReview } = calculateNextReview(
        state.currentProgress.level,
        success
      )

      // Update progress in state
      const updatedProgress = state.allProgress.map((p) =>
        p.letter_id === state.currentLetter!.id
          ? { ...p, level: newLevel, next_review: nextReview, review_count: p.review_count + 1 }
          : p
      )

      if (state.isGuest) {
        // Guest mode - save to localStorage
        const newTotalStars = success ? state.totalStars + 1 : state.totalStars

        if (success) {
          setConfettiTrigger((t) => t + 1)

          // Check for new achievements
          const newAchievementsFound = getNewAchievements(newTotalStars, updatedProgress, guestAchievements)

          if (newAchievementsFound.length > 0) {
            const newAchievementKeys = [...guestAchievements, ...newAchievementsFound.map(a => a.key)]
            setGuestAchievements(newAchievementKeys)
            saveGuestProgress(updatedProgress, newTotalStars, newAchievementKeys)

            // Show the first new achievement
            setNewAchievement(newAchievementsFound[0])
            speak(`Achievement unlocked! ${newAchievementsFound[0].name}`)
            setTimeout(() => setNewAchievement(null), 3000)
          } else {
            saveGuestProgress(updatedProgress, newTotalStars, guestAchievements)
            if (newLevel >= 3) {
              speak('You are a master!')
            } else {
              speak('Great job!')
            }
          }
        } else {
          saveGuestProgress(updatedProgress, newTotalStars, guestAchievements)
          speak("That's okay, let's learn it.")
        }
      } else {
        // Authenticated mode - save to Supabase
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Update progress in database
        await supabase
          .from('card_progress')
          .update({
            level: newLevel,
            next_review: nextReview.toISOString(),
            review_count: state.currentProgress.review_count + 1,
          })
          .eq('user_id', user.id)
          .eq('letter_id', state.currentLetter.id)

        if (success) {
          const newTotalStars = state.totalStars + 1

          // Update stats
          await supabase
            .from('user_stats')
            .upsert({
              user_id: user.id,
              total_stars: newTotalStars,
              last_played_at: new Date().toISOString(),
            })

          setConfettiTrigger((t) => t + 1)

          const { data: earnedAchievements } = await supabase
            .from('user_achievements')
            .select('achievement_key')
            .eq('user_id', user.id)

          const earnedKeys = earnedAchievements?.map((a) => a.achievement_key) || []
          const newAchievementsFound = getNewAchievements(newTotalStars, updatedProgress, earnedKeys)

          if (newAchievementsFound.length > 0) {
            // Save new achievements
            for (const achievement of newAchievementsFound) {
              await supabase
                .from('user_achievements')
                .insert({
                  user_id: user.id,
                  achievement_key: achievement.key,
                })
            }
            // Show the first new achievement
            setNewAchievement(newAchievementsFound[0])
            speak(`Achievement unlocked! ${newAchievementsFound[0].name}`)
            setTimeout(() => setNewAchievement(null), 3000)
          } else if (newLevel >= 3) {
            speak('You are a master!')
          } else {
            speak('Great job!')
          }
        } else {
          speak("That's okay, let's learn it.")
        }
      }

      // Load next card after delay
      setTimeout(loadNextCard, 1000)
    },
    [state, supabase, loadNextCard, guestAchievements]
  )

  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }, [supabase])

  // Initialize on mount
  useEffect(() => {
    loadNextCard()
  }, [loadNextCard])

  return {
    ...state,
    confettiTrigger,
    newAchievement,
    guestAchievements,
    flipCard,
    handleResult,
    signOut,
    loadNextCard,
  }
}
