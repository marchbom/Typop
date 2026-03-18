export interface SongResult {
  id: number
  title: string
  artist: string
  thumbnail: string
  url: string
}

export interface TypingStats {
  wpm: number
  accuracy: number
  correctChars: number
  totalChars: number
}
