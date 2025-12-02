'use client'

import { useEffect, useState } from 'react'

interface ConfettiPiece {
  id: number
  left: string
  color: string
  duration: string
}

const COLORS = ['#FF8BA7', '#5FD3BC', '#FFD700', '#A0C4FF']

export function Confetti({ trigger }: { trigger: number }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    if (trigger === 0) return

    // Spawn 30 confetti pieces
    const newPieces: ConfettiPiece[] = []
    for (let i = 0; i < 30; i++) {
      newPieces.push({
        id: Date.now() + i,
        left: `${Math.random() * 100}vw`,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        duration: `${Math.random() * 2 + 2}s`,
      })
    }
    setPieces(newPieces)

    // Cleanup after animation
    const timer = setTimeout(() => {
      setPieces([])
    }, 4000)

    return () => clearTimeout(timer)
  }, [trigger])

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
  )
}
