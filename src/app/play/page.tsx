"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useGameState } from "@/hooks/useGameState";
import { FlashCard } from "@/components/FlashCard";
import { GameControls } from "@/components/GameControls";
import { StarJar } from "@/components/StarJar";
import { Confetti } from "@/components/Confetti";
import { CardSelectionModal } from "@/components/CardSelectionModal";
import { DeckId, getDeckById } from "@/lib/decks";

function PlayPageContent() {
  const searchParams = useSearchParams();
  const deckParam = searchParams.get("deck") as DeckId | null;
  const deckId: DeckId =
    deckParam && getDeckById(deckParam) ? deckParam : "uppercase";
  const deck = getDeckById(deckId);
  const [showCardSelection, setShowCardSelection] = useState(false);

  const {
    currentLetter,
    currentProgress,
    isFlipped,
    isLoading,
    totalStars,
    confettiTrigger,
    newAchievement,
    isGuest,
    allProgress,
    deckLetters,
    selectedLetterIds,
    flipCard,
    handleResult,
    signOut,
    setSelectedLetterIds,
    startTrainingWithSelection,
  } = useGameState({ deckId });

  const handleStartTraining = () => {
    setShowCardSelection(false);
    startTrainingWithSelection();
  };

  if (isLoading || !currentLetter || !currentProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="text-2xl"
          style={{ fontFamily: "'Fredoka One', cursive", color: "#FF8BA7" }}
        >
          Loading...
        </div>
      </div>
    );
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
              style={{ fontFamily: "'Fredoka One', cursive", color: "#FF8BA7" }}
            >
              Achievement Unlocked!
            </div>
            <div className="text-gray-600">{newAchievement.name}</div>
          </div>
        </div>
      )}

      {/* Card Selection Modal */}
      <CardSelectionModal
        isOpen={showCardSelection}
        onClose={() => setShowCardSelection(false)}
        letters={deckLetters}
        progress={allProgress}
        selectedLetterIds={selectedLetterIds}
        onSelectionChange={setSelectedLetterIds}
        onStartTraining={handleStartTraining}
      />

      {/* Header */}
      <header className="w-full p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <StarJar totalStars={totalStars} />
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-[#5FD3BC] no-underline flex items-center gap-1"
            title="Change pack"
          >
            <span className="text-sm">📚</span>
            {deck?.name || "Uppercase"}
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCardSelection(true)}
            className="text-2xl bg-transparent border-none cursor-pointer hover:scale-110 transition-transform"
            title="Select cards to train"
          >
            📋
          </button>
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
          Playing as guest -{" "}
          <Link href="/" className="font-semibold underline text-[#856404]">
            Sign in
          </Link>{" "}
          to save your progress across devices!
        </div>
      )}

      {/* Game Container */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-4">
        {/* Message Area */}
        <div className="h-8 mb-2 text-center">
          <span className="text-lg font-bold" style={{ color: "#5FD3BC" }}>
            {isFlipped ? "" : "Tap the card!"}
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
  );
}

function PlayPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div
        className="text-2xl"
        style={{ fontFamily: "'Fredoka One', cursive", color: "#FF8BA7" }}
      >
        Loading...
      </div>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<PlayPageLoading />}>
      <PlayPageContent />
    </Suspense>
  );
}
