import { CardProgress } from "./srs";

export interface Achievement {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: "stars" | "letters" | "streak";
  requirement: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Star achievements
  {
    key: "first_star",
    name: "First Star!",
    description: "Earned your first star",
    icon: "⭐",
    category: "stars",
    requirement: 1,
  },
  {
    key: "ten_stars",
    name: "Star Collector",
    description: "Earned 10 stars",
    icon: "🌟",
    category: "stars",
    requirement: 10,
  },
  {
    key: "fifty_stars",
    name: "Shining Bright",
    description: "Earned 50 stars",
    icon: "💫",
    category: "stars",
    requirement: 50,
  },
  {
    key: "hundred_stars",
    name: "Superstar!",
    description: "Earned 100 stars",
    icon: "🏆",
    category: "stars",
    requirement: 100,
  },

  // Letter mastery achievements
  {
    key: "first_mastered",
    name: "Letter Learner",
    description: "Mastered your first letter",
    icon: "📖",
    category: "letters",
    requirement: 1,
  },
  {
    key: "five_mastered",
    name: "Word Builder",
    description: "Mastered 5 letters",
    icon: "📚",
    category: "letters",
    requirement: 5,
  },
  {
    key: "thirteen_mastered",
    name: "Halfway There!",
    description: "Mastered half the alphabet",
    icon: "🎯",
    category: "letters",
    requirement: 13,
  },
  {
    key: "alphabet_master",
    name: "Alphabet Champion",
    description: "Mastered all 26 letters!",
    icon: "👑",
    category: "letters",
    requirement: 26,
  },
];

export interface AchievementCheckResult {
  achievement: Achievement;
  isNew: boolean;
}

export function checkAchievements(
  totalStars: number,
  progress: CardProgress[],
  earnedKeys: string[],
): AchievementCheckResult[] {
  const results: AchievementCheckResult[] = [];
  const masteredCount = progress.filter((p) => p.level >= 3).length;

  for (const achievement of ACHIEVEMENTS) {
    let earned = false;

    switch (achievement.category) {
      case "stars":
        earned = totalStars >= achievement.requirement;
        break;
      case "letters":
        earned = masteredCount >= achievement.requirement;
        break;
      case "streak":
        // Streak checking would require additional data
        break;
    }

    if (earned) {
      results.push({
        achievement,
        isNew: !earnedKeys.includes(achievement.key),
      });
    }
  }

  return results;
}

export function getNewAchievements(
  totalStars: number,
  progress: CardProgress[],
  earnedKeys: string[],
): Achievement[] {
  return checkAchievements(totalStars, progress, earnedKeys)
    .filter((r) => r.isNew)
    .map((r) => r.achievement);
}
