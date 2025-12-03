"use client";

interface StarJarProps {
  totalStars: number;
}

export function StarJar({ totalStars }: StarJarProps) {
  return (
    <div
      className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md text-xl"
      style={{ fontFamily: "'Fredoka One', cursive", color: "#4a4a4a" }}
    >
      <span>⭐</span>
      <span>{totalStars}</span>
      <span className="text-base">Stars</span>
    </div>
  );
}
