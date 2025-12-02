'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ACHIEVEMENTS, Achievement } from '@/lib/achievements'
import Link from 'next/link'

export default function AchievementsPage() {
  const [earnedKeys, setEarnedKeys] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadAchievements() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('user_achievements')
        .select('achievement_key')
        .eq('user_id', user.id)

      if (data) {
        setEarnedKeys(data.map((a) => a.achievement_key))
      }
      setLoading(false)
    }

    loadAchievements()
  }, [supabase])

  if (loading) {
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
    <div className="min-h-screen p-4">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <Link
          href="/play"
          className="text-[#5FD3BC] font-bold text-lg no-underline"
        >
          ← Back to Game
        </Link>
      </header>

      <div className="max-w-lg mx-auto">
        <h1
          className="text-3xl text-center mb-8"
          style={{ fontFamily: "'Fredoka One', cursive", color: '#FF8BA7' }}
        >
          My Achievements
        </h1>

        <div className="space-y-4">
          {ACHIEVEMENTS.map((achievement) => {
            const isEarned = earnedKeys.includes(achievement.key)
            return (
              <AchievementCard
                key={achievement.key}
                achievement={achievement}
                isEarned={isEarned}
              />
            )
          })}
        </div>

        <div className="mt-8 text-center text-gray-500">
          {earnedKeys.length} of {ACHIEVEMENTS.length} achievements unlocked
        </div>
      </div>
    </div>
  )
}

function AchievementCard({
  achievement,
  isEarned,
}: {
  achievement: Achievement
  isEarned: boolean
}) {
  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-2xl ${
        isEarned
          ? 'bg-white shadow-md'
          : 'bg-gray-100 opacity-60'
      }`}
    >
      <div
        className={`text-4xl ${isEarned ? '' : 'grayscale'}`}
      >
        {achievement.icon}
      </div>
      <div className="flex-1">
        <h3
          className="font-bold text-lg"
          style={{
            fontFamily: "'Fredoka One', cursive",
            color: isEarned ? '#4a4a4a' : '#999',
          }}
        >
          {achievement.name}
        </h3>
        <p className="text-gray-500 text-sm">{achievement.description}</p>
      </div>
      {isEarned && (
        <div className="text-2xl">✓</div>
      )}
    </div>
  )
}
