// Text-to-speech utility for the learning app

export function speak(text: string): void {
  if (typeof window === 'undefined') return
  if (!('speechSynthesis' in window)) return

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.9 // Slightly slower for kids
  utterance.pitch = 1.1 // Slightly higher/friendly
  window.speechSynthesis.speak(utterance)
}

export function cancelSpeech(): void {
  if (typeof window === 'undefined') return
  if (!('speechSynthesis' in window)) return

  window.speechSynthesis.cancel()
}
