"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Letter } from "@/lib/letters";
import { calculateNextReview, selectNextCard, CardProgress } from "@/lib/srs";
import { speak } from "@/lib/speech";
import { migrateFromLocalStorage } from "@/lib/migration";
import { getNewAchievements, Achievement } from "@/lib/achievements";
import { DeckId, getLettersForDeck } from "@/lib/decks";

function getGuestProgressKey(deckId: DeckId): string {
  return `abc_guest_progress_${deckId}`;
}

function getGuestStatsKey(deckId: DeckId): string {
  return `abc_guest_stats_${deckId}`;
}

function getGuestAchievementsKey(deckId: DeckId): string {
  return `abc_guest_achievements_${deckId}`;
}

// Legacy keys for migration
const GUEST_PROGRESS_KEY = "abc_guest_progress";
const GUEST_STATS_KEY = "abc_guest_stats";
const GUEST_ACHIEVEMENTS_KEY = "abc_guest_achievements";

interface GuestProgress {
  cards: CardProgress[];
  totalStars: number;
  achievements: string[];
}

function loadGuestProgress(deckId: DeckId): GuestProgress {
  if (typeof window === "undefined") {
    return { cards: [], totalStars: 0, achievements: [] };
  }

  const deckLetters = getLettersForDeck(deckId);
  const progressKey = getGuestProgressKey(deckId);
  const statsKey = getGuestStatsKey(deckId);
  const achievementsKey = getGuestAchievementsKey(deckId);

  const savedProgress = localStorage.getItem(progressKey);
  const savedStats = localStorage.getItem(statsKey);
  const savedAchievements = localStorage.getItem(achievementsKey);

  let cards: CardProgress[] = [];
  if (savedProgress) {
    try {
      const parsed = JSON.parse(savedProgress);
      cards = parsed.map((p: CardProgress & { next_review: string }) => ({
        ...p,
        next_review: new Date(p.next_review),
      }));
    } catch {
      cards = [];
    }
  }

  // Initialize cards if empty or if deck letters changed
  if (cards.length === 0 || cards.length !== deckLetters.length) {
    // Preserve any existing progress for letters that still exist
    const existingProgressMap = new Map(cards.map((c) => [c.letter_id, c]));

    cards = deckLetters.map((l) => {
      const existing = existingProgressMap.get(l.id);
      if (existing) {
        return existing;
      }
      return {
        id: l.id,
        letter_id: l.id,
        level: 0,
        next_review: new Date(),
        review_count: 0,
      };
    });
    localStorage.setItem(progressKey, JSON.stringify(cards));
  }

  const totalStars = savedStats ? parseInt(savedStats, 10) || 0 : 0;
  const achievements = savedAchievements ? JSON.parse(savedAchievements) : [];

  return { cards, totalStars, achievements };
}

function saveGuestProgress(
  deckId: DeckId,
  cards: CardProgress[],
  totalStars: number,
  achievements: string[],
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getGuestProgressKey(deckId), JSON.stringify(cards));
  localStorage.setItem(getGuestStatsKey(deckId), totalStars.toString());
  localStorage.setItem(
    getGuestAchievementsKey(deckId),
    JSON.stringify(achievements),
  );
}

interface GameState {
  currentLetter: Letter | null;
  currentProgress: CardProgress | null;
  isFlipped: boolean;
  isLoading: boolean;
  totalStars: number;
  allProgress: CardProgress[];
  isGuest: boolean;
  deckId: DeckId;
  selectedLetterIds: Set<string>;
}

interface UseGameStateOptions {
  deckId?: DeckId;
}

export function useGameState(options: UseGameStateOptions = {}) {
  const { deckId = "uppercase" } = options;
  const deckLetters = useMemo(() => getLettersForDeck(deckId), [deckId]);
  const [state, setState] = useState<GameState>({
    currentLetter: null,
    currentProgress: null,
    isFlipped: false,
    isLoading: true,
    totalStars: 0,
    allProgress: [],
    isGuest: true,
    deckId,
    selectedLetterIds: new Set<string>(),
  });
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(
    null,
  );
  const [guestAchievements, setGuestAchievements] = useState<string[]>([]);
  const hasMigrated = useRef(false);
  const supabase = useMemo(() => createClient(), []);

  // Try to migrate from localStorage on first load
  const tryMigration = useCallback(
    async (userId: string) => {
      if (hasMigrated.current || !supabase) return;
      hasMigrated.current = true;

      const result = await migrateFromLocalStorage(supabase, userId);
      if (result.migrated) {
        console.log(
          `Migrated ${result.starsImported} stars and ${result.lettersImported} letters from local storage`,
        );
      }
    },
    [supabase],
  );

  // Migrate guest progress to authenticated user
  const migrateGuestToUser = useCallback(
    async (userId: string) => {
      if (!supabase) return; // Can't migrate without Supabase

      const guestProgress = localStorage.getItem(GUEST_PROGRESS_KEY);
      const guestStats = localStorage.getItem(GUEST_STATS_KEY);
      const guestAchievementsData = localStorage.getItem(
        GUEST_ACHIEVEMENTS_KEY,
      );

      if (!guestProgress && !guestStats) return; // No guest data to migrate

      try {
        // Migrate card progress
        if (guestProgress) {
          const cards = JSON.parse(guestProgress) as CardProgress[];
          for (const card of cards) {
            if (card.level > 0 || card.review_count > 0) {
              await supabase.from("card_progress").upsert(
                {
                  user_id: userId,
                  letter_id: card.letter_id,
                  level: card.level,
                  next_review: new Date(card.next_review).toISOString(),
                  review_count: card.review_count,
                },
                { onConflict: "user_id,letter_id" },
              );
            }
          }
        }

        // Migrate stars
        if (guestStats) {
          const totalStars = parseInt(guestStats, 10) || 0;
          if (totalStars > 0) {
            await supabase.from("user_stats").upsert({
              user_id: userId,
              total_stars: totalStars,
              last_played_at: new Date().toISOString(),
            });
          }
        }

        // Migrate achievements
        if (guestAchievementsData) {
          const achievements = JSON.parse(guestAchievementsData) as string[];
          for (const achievementKey of achievements) {
            await supabase.from("user_achievements").upsert(
              {
                user_id: userId,
                achievement_key: achievementKey,
              },
              { onConflict: "user_id,achievement_key" },
            );
          }
        }

        // Clear guest data after successful migration
        localStorage.removeItem(GUEST_PROGRESS_KEY);
        localStorage.removeItem(GUEST_STATS_KEY);
        localStorage.removeItem(GUEST_ACHIEVEMENTS_KEY);

        console.log("Migrated guest progress to authenticated user");
      } catch (error) {
        console.error("Error migrating guest progress:", error);
      }
    },
    [supabase],
  );

  // Load progress from Supabase or localStorage for guests
  const loadProgress = useCallback(async (): Promise<{
    cards: CardProgress[];
    isGuest: boolean;
    guestAchievements: string[];
  }> => {
    // If Supabase is not configured, always use guest mode
    if (!supabase) {
      const guestData = loadGuestProgress(deckId);
      setGuestAchievements(guestData.achievements);
      return {
        cards: guestData.cards,
        isGuest: true,
        guestAchievements: guestData.achievements,
      };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Guest mode - use localStorage
    if (!user) {
      const guestData = loadGuestProgress(deckId);
      setGuestAchievements(guestData.achievements);
      return {
        cards: guestData.cards,
        isGuest: true,
        guestAchievements: guestData.achievements,
      };
    }

    // Authenticated user - use Supabase
    // Try migration first (from old localStorage AND from guest progress)
    await tryMigration(user.id);
    await migrateGuestToUser(user.id);

    // Get letter IDs for this deck
    const deckLetterIds = deckLetters.map((l) => l.id);

    const { data: progress } = await supabase
      .from("card_progress")
      .select("*")
      .eq("user_id", user.id)
      .in("letter_id", deckLetterIds);

    if (progress && progress.length > 0) {
      // Check if we have all letters for this deck
      const existingLetterIds = new Set(progress.map((p) => p.letter_id));
      const missingLetters = deckLetters.filter(
        (l) => !existingLetterIds.has(l.id),
      );

      // Insert missing letters
      if (missingLetters.length > 0) {
        await supabase.from("card_progress").insert(
          missingLetters.map((l) => ({
            user_id: user.id,
            letter_id: l.id,
            level: 0,
            next_review: new Date().toISOString(),
            review_count: 0,
          })),
        );
      }

      // Reload with all letters
      const { data: allProgress } = await supabase
        .from("card_progress")
        .select("*")
        .eq("user_id", user.id)
        .in("letter_id", deckLetterIds);

      if (allProgress) {
        return {
          cards: allProgress.map((p) => ({
            id: p.id,
            letter_id: p.letter_id,
            level: p.level,
            next_review: new Date(p.next_review),
            review_count: p.review_count,
          })),
          isGuest: false,
          guestAchievements: [],
        };
      }
    }

    // Initialize progress for new user with this deck's letters
    const initialProgress = deckLetters.map((l) => ({
      id: "", // Will be set by DB
      letter_id: l.id,
      level: 0,
      next_review: new Date(),
      review_count: 0,
    }));

    // Insert initial progress
    const { data: inserted } = await supabase
      .from("card_progress")
      .insert(
        initialProgress.map((p) => ({
          user_id: user.id,
          letter_id: p.letter_id,
          level: p.level,
          next_review: p.next_review.toISOString(),
          review_count: p.review_count,
        })),
      )
      .select();

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
      };
    }

    return { cards: initialProgress, isGuest: false, guestAchievements: [] };
  }, [supabase, deckId, deckLetters, tryMigration, migrateGuestToUser]);

  // Load stats
  const loadStats = useCallback(
    async (isGuest: boolean) => {
      if (isGuest || !supabase) {
        const guestStats = localStorage.getItem(getGuestStatsKey(deckId));
        return guestStats ? parseInt(guestStats, 10) || 0 : 0;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data: stats } = await supabase
        .from("user_stats")
        .select("total_stars")
        .eq("user_id", user.id)
        .single();

      return stats?.total_stars || 0;
    },
    [supabase, deckId],
  );

  // Load next card
  const loadNextCard = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, isFlipped: false }));

    const {
      cards: progress,
      isGuest,
      guestAchievements: loadedGuestAchievements,
    } = await loadProgress();
    const totalStars = await loadStats(isGuest);

    if (loadedGuestAchievements) {
      setGuestAchievements(loadedGuestAchievements);
    }

    // Filter progress by selected cards if any are selected
    setState((prevState) => {
      const filteredProgress =
        prevState.selectedLetterIds.size > 0
          ? progress.filter((p) => prevState.selectedLetterIds.has(p.letter_id))
          : progress;

      const nextCard = selectNextCard(filteredProgress);

      if (nextCard) {
        const letter = deckLetters.find((l) => l.id === nextCard.letter_id);
        return {
          ...prevState,
          currentLetter: letter || deckLetters[0],
          currentProgress: nextCard,
          isFlipped: false,
          isLoading: false,
          totalStars,
          allProgress: progress,
          isGuest,
          deckId,
        };
      } else {
        return { ...prevState, isLoading: false, isGuest, deckId, allProgress: progress, totalStars };
      }
    });
  }, [loadProgress, loadStats, deckLetters, deckId]);

  // Flip the card
  const flipCard = useCallback(() => {
    if (state.isFlipped) return;

    setState((s) => ({ ...s, isFlipped: true }));

    if (state.currentLetter) {
      speak(state.currentLetter.sound);
    }
  }, [state.isFlipped, state.currentLetter]);

  // Handle result (correct/incorrect)
  const handleResult = useCallback(
    async (success: boolean) => {
      if (!state.isFlipped || !state.currentProgress || !state.currentLetter)
        return;

      const { newLevel, nextReview } = calculateNextReview(
        state.currentProgress.level,
        success,
      );

      // Update progress in state
      const updatedProgress = state.allProgress.map((p) =>
        p.letter_id === state.currentLetter!.id
          ? {
              ...p,
              level: newLevel,
              next_review: nextReview,
              review_count: p.review_count + 1,
            }
          : p,
      );

      if (state.isGuest) {
        // Guest mode - save to localStorage
        const newTotalStars = success ? state.totalStars + 1 : state.totalStars;

        if (success) {
          setConfettiTrigger((t) => t + 1);

          // Check for new achievements
          const newAchievementsFound = getNewAchievements(
            newTotalStars,
            updatedProgress,
            guestAchievements,
          );

          if (newAchievementsFound.length > 0) {
            const newAchievementKeys = [
              ...guestAchievements,
              ...newAchievementsFound.map((a) => a.key),
            ];
            setGuestAchievements(newAchievementKeys);
            saveGuestProgress(
              deckId,
              updatedProgress,
              newTotalStars,
              newAchievementKeys,
            );

            // Show the first new achievement
            setNewAchievement(newAchievementsFound[0]);
            speak(`Achievement unlocked! ${newAchievementsFound[0].name}`);
            setTimeout(() => setNewAchievement(null), 3000);
          } else {
            saveGuestProgress(
              deckId,
              updatedProgress,
              newTotalStars,
              guestAchievements,
            );
            if (newLevel >= 3) {
              speak("You are a master!");
            } else {
              speak("Great job!");
            }
          }
        } else {
          saveGuestProgress(
            deckId,
            updatedProgress,
            newTotalStars,
            guestAchievements,
          );
          speak("That's okay, let's learn it.");
        }
      } else {
        // Authenticated mode - save to Supabase
        if (!supabase) return;
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Update progress in database
        await supabase
          .from("card_progress")
          .update({
            level: newLevel,
            next_review: nextReview.toISOString(),
            review_count: state.currentProgress.review_count + 1,
          })
          .eq("user_id", user.id)
          .eq("letter_id", state.currentLetter.id);

        if (success) {
          const newTotalStars = state.totalStars + 1;

          // Update stats
          await supabase.from("user_stats").upsert({
            user_id: user.id,
            total_stars: newTotalStars,
            last_played_at: new Date().toISOString(),
          });

          setConfettiTrigger((t) => t + 1);

          const { data: earnedAchievements } = await supabase
            .from("user_achievements")
            .select("achievement_key")
            .eq("user_id", user.id);

          const earnedKeys =
            earnedAchievements?.map((a) => a.achievement_key) || [];
          const newAchievementsFound = getNewAchievements(
            newTotalStars,
            updatedProgress,
            earnedKeys,
          );

          if (newAchievementsFound.length > 0) {
            // Save new achievements
            for (const achievement of newAchievementsFound) {
              await supabase.from("user_achievements").insert({
                user_id: user.id,
                achievement_key: achievement.key,
              });
            }
            // Show the first new achievement
            setNewAchievement(newAchievementsFound[0]);
            speak(`Achievement unlocked! ${newAchievementsFound[0].name}`);
            setTimeout(() => setNewAchievement(null), 3000);
          } else if (newLevel >= 3) {
            speak("You are a master!");
          } else {
            speak("Great job!");
          }
        } else {
          speak("That's okay, let's learn it.");
        }
      }

      // Load next card after delay
      setTimeout(loadNextCard, 1000);
    },
    [state, supabase, loadNextCard, guestAchievements, deckId],
  );

  // Sign out
  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    window.location.href = "/";
  }, [supabase]);

  // Set selected letter IDs for training
  const setSelectedLetterIds = useCallback((ids: Set<string>) => {
    setState((s) => ({ ...s, selectedLetterIds: ids }));
  }, []);

  // Start training with selected cards
  const startTrainingWithSelection = useCallback(() => {
    loadNextCard();
  }, [loadNextCard]);

  // Initialize on mount - this is an intentional initialization effect
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNextCard();
  }, [loadNextCard]);

  return {
    ...state,
    deckLetters,
    confettiTrigger,
    newAchievement,
    guestAchievements,
    flipCard,
    handleResult,
    signOut,
    loadNextCard,
    setSelectedLetterIds,
    startTrainingWithSelection,
  };
}
