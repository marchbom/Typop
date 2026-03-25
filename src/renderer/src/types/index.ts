export type CharState = "pending" | "correct" | "wrong"

export interface SpeedText {
  text: string
  source: "proverb" | "news"
  meaning?: string
}
