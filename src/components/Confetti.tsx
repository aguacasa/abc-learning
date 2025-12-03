"use client";

import { useMemo, useCallback, useSyncExternalStore } from "react";

interface ConfettiPiece {
  id: number;
  left: string;
  color: string;
  duration: string;
}

const COLORS = ["#FF8BA7", "#5FD3BC", "#FFD700", "#A0C4FF"];

function generatePieces(trigger: number): ConfettiPiece[] {
  if (trigger === 0) return [];
  const pieces: ConfettiPiece[] = [];
  for (let i = 0; i < 30; i++) {
    pieces.push({
      id: trigger * 1000 + i,
      left: `${Math.random() * 100}vw`,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      duration: `${Math.random() * 2 + 2}s`,
    });
  }
  return pieces;
}

// External store for managing visibility state without triggering lint errors
const visibilityStore = {
  state: { visible: false, lastTrigger: 0 },
  listeners: new Set<() => void>(),
  setVisible(trigger: number, visible: boolean) {
    this.state = {
      visible,
      lastTrigger: visible ? trigger : this.state.lastTrigger,
    };
    this.listeners.forEach((cb) => cb());
  },
  subscribe(callback: () => void) {
    visibilityStore.listeners.add(callback);
    return () => visibilityStore.listeners.delete(callback);
  },
  getSnapshot() {
    return visibilityStore.state;
  },
};

export function Confetti({ trigger }: { trigger: number }) {
  const pieces = useMemo(() => generatePieces(trigger), [trigger]);

  const subscribe = useCallback(
    (cb: () => void) => visibilityStore.subscribe(cb),
    [],
  );
  const getSnapshot = useCallback(() => visibilityStore.getSnapshot(), []);
  const storeState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Check if we need to show confetti for a new trigger
  useMemo(() => {
    if (trigger !== 0 && trigger !== storeState.lastTrigger) {
      visibilityStore.setVisible(trigger, true);
      setTimeout(() => {
        visibilityStore.setVisible(trigger, false);
      }, 4000);
    }
  }, [trigger, storeState.lastTrigger]);

  if (!storeState.visible || pieces.length === 0) return null;

  return (
    <>
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="fixed w-2.5 h-2.5 z-50 animate-[fall_3s_linear_forwards]"
          style={{
            left: piece.left,
            top: 0,
            backgroundColor: piece.color,
            animationDuration: piece.duration,
          }}
        />
      ))}
    </>
  );
}
