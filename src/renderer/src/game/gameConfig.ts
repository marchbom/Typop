export const ROUND_DURATION = 30

export type Phase = "idle" | "playing" | "roundbreak" | "gameover"

export interface FallingWord {
  id: number
  text: string
  x: number
  y: number
  speed: number
}

export interface RoundConfig {
  speed: number
  spawnInterval: number
  maxWords: number
}

export const getRoundConfig = (round: number): RoundConfig => ({
  speed: 30 + (round - 1) * 28,
  spawnInterval: Math.max(0.5, 2.5 - (round - 1) * 0.4),
  maxWords: 5 + (round - 1),
})
