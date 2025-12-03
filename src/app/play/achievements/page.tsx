"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { ACHIEVEMENTS, Achievement } from "@/lib/achievements";
import Link from "next/link";

const GUEST_ACHIEVEMENTS_KEY = "abc_guest_achievements";

export default function AchievementsPage() {
  const [earnedKeys, setEarnedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadAchievements() {
      // If Supabase is not configured, always use guest mode
      if (!supabase) {
        setIsGuest(true);
        const savedAchievements = localStorage.getItem(GUEST_ACHIEVEMENTS_KEY);
        if (savedAchievements) {
          try {
            setEarnedKeys(JSON.parse(savedAchievements));
          } catch {
            setEarnedKeys([]);
          }
        }
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Guest mode - load from localStorage
        setIsGuest(true);
        const savedAchievements = localStorage.getItem(GUEST_ACHIEVEMENTS_KEY);
        if (savedAchievements) {
          try {
            setEarnedKeys(JSON.parse(savedAchievements));
          } catch {
            setEarnedKeys([]);
          }
        }
        setLoading(false);
        return;
      }

      // Authenticated - load from Supabase
      setIsGuest(false);
      const { data } = await supabase
        .from("user_achievements")
        .select("achievement_key")
        .eq("user_id", user.id);

      if (data) {
        setEarnedKeys(data.map((a) => a.achievement_key));
      }
      setLoading(false);
    }

    loadAchievements();
  }, [supabase]);

  if (loading) {
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
    <div className="min-h-screen">
      {/* Guest mode banner */}
      {isGuest && (
        <div className="w-full bg-[#FFF3CD] px-4 py-2 text-center text-sm text-[#856404]">
          Playing as guest -{" "}
          <Link href="/" className="font-semibold underline text-[#856404]">
            Sign in
          </Link>{" "}
          to save your achievements!
        </div>
      )}

      <div className="p-4">
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
            style={{ fontFamily: "'Fredoka One', cursive", color: "#FF8BA7" }}
          >
            My Achievements
          </h1>

          <div className="space-y-4">
            {ACHIEVEMENTS.map((achievement) => {
              const isEarned = earnedKeys.includes(achievement.key);
              return (
                <AchievementCard
                  key={achievement.key}
                  achievement={achievement}
                  isEarned={isEarned}
                />
              );
            })}
          </div>

          <div className="mt-8 text-center text-gray-500">
            {earnedKeys.length} of {ACHIEVEMENTS.length} achievements unlocked
          </div>
        </div>
      </div>
    </div>
  );
}

function AchievementCard({
  achievement,
  isEarned,
}: {
  achievement: Achievement;
  isEarned: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-2xl ${
        isEarned ? "bg-white shadow-md" : "bg-gray-100 opacity-60"
      }`}
    >
      <div className={`text-4xl ${isEarned ? "" : "grayscale"}`}>
        {achievement.icon}
      </div>
      <div className="flex-1">
        <h3
          className="font-bold text-lg"
          style={{
            fontFamily: "'Fredoka One', cursive",
            color: isEarned ? "#4a4a4a" : "#999",
          }}
        >
          {achievement.name}
        </h3>
        <p className="text-gray-500 text-sm">{achievement.description}</p>
      </div>
      {isEarned && <div className="text-2xl">✓</div>}
    </div>
  );
}
