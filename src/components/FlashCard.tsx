"use client";

import { Letter } from "@/lib/letters";
import styles from "./FlashCard.module.css";

interface FlashCardProps {
  letter: Letter;
  level: number;
  isFlipped: boolean;
  onFlip: () => void;
}

export function FlashCard({
  letter,
  level,
  isFlipped,
  onFlip,
}: FlashCardProps) {
  return (
    <div className={styles.scene} onClick={onFlip}>
      <div className={`${styles.card} ${isFlipped ? styles.isFlipped : ""}`}>
        {/* Front Face */}
        <div className={styles.cardFace}>
          <div className={styles.cardStars}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`${styles.miniStar} ${i < level ? styles.miniStarFilled : ""}`}
              >
                ★
              </span>
            ))}
          </div>
          <h1 className={styles.letterDisplay}>{letter.display}</h1>
          <div className={styles.instruction}>Tap to flip</div>
        </div>

        {/* Back Face */}
        <div className={`${styles.cardFace} ${styles.cardBack}`}>
          <h1 className={styles.letterDisplay}>{letter.back}</h1>
          <div className={styles.instruction}>{letter.word}</div>
        </div>
      </div>
    </div>
  );
}
