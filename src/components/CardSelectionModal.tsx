"use client";

import { Letter } from "@/lib/letters";
import { CardProgress } from "@/lib/srs";

interface CardSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  letters: Letter[];
  progress: CardProgress[];
  selectedLetterIds: Set<string>;
  onSelectionChange: (letterIds: Set<string>) => void;
  onStartTraining: () => void;
}

function StarDisplay({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="text-xs"
          style={{ opacity: i < level ? 1 : 0.3 }}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}

export function CardSelectionModal({
  isOpen,
  onClose,
  letters,
  progress,
  selectedLetterIds,
  onSelectionChange,
  onStartTraining,
}: CardSelectionModalProps) {
  if (!isOpen) return null;

  const progressMap = new Map(progress.map((p) => [p.letter_id, p]));

  const handleCardToggle = (letterId: string) => {
    const newSelection = new Set(selectedLetterIds);
    if (newSelection.has(letterId)) {
      newSelection.delete(letterId);
    } else {
      newSelection.add(letterId);
    }
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    onSelectionChange(new Set(letters.map((l) => l.id)));
  };

  const handleDeselectAll = () => {
    onSelectionChange(new Set());
  };

  const selectedCount = selectedLetterIds.size;
  const allSelected = selectedCount === letters.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: "'Fredoka One', cursive", color: "#FF8BA7" }}
          >
            Select Cards
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors border-none cursor-pointer text-gray-500 text-xl"
          >
            ×
          </button>
        </div>

        {/* Selection controls */}
        <div className="px-4 py-3 border-b border-gray-100 flex gap-2 shrink-0">
          <button
            onClick={allSelected ? handleDeselectAll : handleSelectAll}
            className="px-3 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-colors border-2"
            style={{
              backgroundColor: allSelected ? "#5FD3BC" : "white",
              borderColor: "#5FD3BC",
              color: allSelected ? "white" : "#5FD3BC",
            }}
          >
            {allSelected ? "Deselect All" : "Select All"}
          </button>
          <span className="text-sm text-gray-500 flex items-center">
            {selectedCount} of {letters.length} selected
          </span>
        </div>

        {/* Card grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-4 gap-2">
            {letters.map((letter) => {
              const cardProgress = progressMap.get(letter.id);
              const level = cardProgress?.level ?? 0;
              const isSelected = selectedLetterIds.has(letter.id);

              return (
                <button
                  key={letter.id}
                  onClick={() => handleCardToggle(letter.id)}
                  className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 border-3"
                  style={{
                    backgroundColor: isSelected ? "#E8F8F5" : "#F8F9FA",
                    borderColor: isSelected ? "#5FD3BC" : "transparent",
                    borderWidth: "3px",
                  }}
                >
                  <span
                    className="text-2xl font-bold"
                    style={{
                      fontFamily: "'Fredoka One', cursive",
                      color: isSelected ? "#5FD3BC" : "#333",
                    }}
                  >
                    {letter.display}
                  </span>
                  <StarDisplay level={level} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onStartTraining}
            disabled={selectedCount === 0}
            className="w-full py-3 rounded-xl text-white text-lg font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] border-none"
            style={{
              fontFamily: "'Fredoka One', cursive",
              backgroundColor: selectedCount > 0 ? "#5FD3BC" : "#ccc",
              boxShadow: selectedCount > 0 ? "0 4px 0 rgba(0,0,0,0.1)" : "none",
            }}
          >
            {selectedCount === 0
              ? "Select cards to train"
              : selectedCount === letters.length
                ? "Train All Cards"
                : `Train ${selectedCount} Card${selectedCount !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
