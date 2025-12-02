'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { letters, Letter } from '@/lib/letters'
import { calculateNextReview, selectNextCard, CardProgress } from '@/lib/srs'
import { speak } from '@/lib/speech'
import { migrateFromLocalStorage } from '@/lib/migration'
import { getNewAchievements, Achievement } from '@/lib/achievements'

interface GameState {
  currentLetter: Letter | null
  currentProgress: CardProgress | null
  isFlipped: boolean
  isLoading: boolean
  totalStars: number
  allProgress: CardProgress[]
}

export function useGameState() {
  const [state, setState] = useState<GameState>({
    currentLetter: null,
    currentProgress: null,
    isFlipped: false,
    isLoading: true,
    totalStars: 0,
    allProgress: [],
  })
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null)
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

  // Load progress from Supabase
  const loadProgress = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Try migration first
    await tryMigration(user.id)

    const { data: progress } = await supabase
      .from('card_progress')
      .select('*')
      .eq('user_id', user.id)

    if (progress && progress.length > 0) {
      return progress.map((p) => ({
        id: p.id,
        letter_id: p.letter_id,
        level: p.level,
        next_review: new Date(p.next_review),
        review_count: p.review_count,
      }))
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
      return inserted.map((p) => ({
        id: p.id,
        letter_id: p.letter_id,
        level: p.level,
        next_review: new Date(p.next_review),
        review_count: p.review_count,
      }))
    }

    return initialProgress
  }, [supabase])

  // Load stats
  const loadStats = useCallback(async () => {
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

    const progress = await loadProgress()
    const totalStars = await loadStats()
    const nextCard = selectNextCard(progress)

    if (nextCard) {
      const letter = letters.find((l) => l.id === nextCard.letter_id)
      setState({
        currentLetter: letter || letters[0],
        currentProgress: nextCard,
        isFlipped: false,
        isLoading: false,
        totalStars,
        allProgress: progress,
      })

      // Speak letter after delay
      setTimeout(() => {
        if (letter) speak(letter.display)
      }, 500)
    } else {
      setState((s) => ({ ...s, isLoading: false }))
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

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { newLevel, nextReview } = calculateNextReview(
        state.currentProgress.level,
        success
      )

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

        // Check for new achievements
        const updatedProgress = state.allProgress.map((p) =>
          p.letter_id === state.currentLetter!.id
            ? { ...p, level: newLevel }
            : p
        )

        const { data: earnedAchievements } = await supabase
          .from('user_achievements')
          .select('achievement_key')
          .eq('user_id', user.id)

        const earnedKeys = earnedAchievements?.map((a) => a.achievement_key) || []
        const newAchievements = getNewAchievements(newTotalStars, updatedProgress, earnedKeys)

        if (newAchievements.length > 0) {
          // Save new achievements
          for (const achievement of newAchievements) {
            await supabase
              .from('user_achievements')
              .insert({
                user_id: user.id,
                achievement_key: achievement.key,
              })
          }
          // Show the first new achievement
          setNewAchievement(newAchievements[0])
          speak(`Achievement unlocked! ${newAchievements[0].name}`)
          setTimeout(() => setNewAchievement(null), 3000)
        } else if (newLevel >= 3) {
          speak('You are a master!')
        } else {
          speak('Great job!')
        }
      } else {
        speak("That's okay, let's learn it.")
      }

      // Load next card after delay
      setTimeout(loadNextCard, 1000)
    },
    [state, supabase, loadNextCard]
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
    flipCard,
    handleResult,
    signOut,
    loadNextCard,
  }
}
