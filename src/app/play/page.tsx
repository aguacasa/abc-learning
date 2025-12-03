'use client'

import Link from 'next/link'
import { useGameState } from '@/hooks/useGameState'
import { FlashCard } from '@/components/FlashCard'
import { GameControls } from '@/components/GameControls'
import { StarJar } from '@/components/StarJar'
import { Confetti } from '@/components/Confetti'

export default function PlayPage() {
  const {
    currentLetter,
    currentProgress,
    isFlipped,
    isLoading,
    totalStars,
    confettiTrigger,
    newAchievement,
    isGuest,
    flipCard,
    handleResult,
    signOut,
  } = useGameState()

  if (isLoading || !currentLetter || !currentProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="text-2xl"
          style={{ fontFamily: "'Fredoka One', cursive", color: '#FF8BA7' }}
        >
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      <Confetti trigger={confettiTrigger} />

      {/* Achievement Toast */}
      {newAchievement && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 animate-bounce">
          <span className="text-4xl">{newAchievement.icon}</span>
          <div>
            <div
              className="font-bold"
              style={{ fontFamily: "'Fredoka One', cursive", color: '#FF8BA7' }}
            >
              Achievement Unlocked!
            </div>
            <div className="text-gray-600">{newAchievement.name}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="w-full p-4 flex justify-between items-center">
        <StarJar totalStars={totalStars} />
        <div className="flex items-center gap-4">
          <Link
            href="/play/achievements"
            className="text-2xl no-underline hover:scale-110 transition-transform"
            title="Achievements"
          >
            🏆
          </Link>
          {isGuest ? (
            <Link
              href="/"
              className="text-[#5FD3BC] text-sm font-semibold no-underline hover:underline"
            >
              Save Progress
            </Link>
          ) : (
            <button
              onClick={signOut}
              className="text-gray-400 text-sm hover:text-gray-600 bg-transparent border-none cursor-pointer"
            >
              Sign Out
            </button>
          )}
        </div>
      </header>

      {/* Guest mode banner */}
      {isGuest && (
        <div className="w-full bg-[#FFF3CD] px-4 py-2 text-center text-sm text-[#856404]">
          Playing as guest - <Link href="/" className="font-semibold underline text-[#856404]">Sign in</Link> to save your progress across devices!
        </div>
      )}

      {/* Game Container */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-4">
        {/* Message Area */}
        <div className="h-8 mb-2 text-center">
          <span
            className="text-lg font-bold"
            style={{ color: '#5FD3BC' }}
          >
            {isFlipped ? '' : 'Tap the card!'}
          </span>
        </div>

        {/* Flash Card */}
        <FlashCard
          letter={currentLetter}
          level={currentProgress.level}
          isFlipped={isFlipped}
          onFlip={flipCard}
        />

        {/* Controls */}
        <GameControls
          visible={isFlipped}
          onHard={() => handleResult(false)}
          onEasy={() => handleResult(true)}
        />
      </div>
    </div>
  )
}
