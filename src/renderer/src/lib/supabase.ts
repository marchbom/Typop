import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "implicit"
  }
})

export interface ScoreRow {
  id: string
  user_id: string
  user_name: string
  user_avatar: string | null
  score: number
  round: number
  total_time: number
  created_at: string
}

export const fetchTopScores = async (limit = 20): Promise<ScoreRow[]> => {
  const { data } = await supabase.from("scores").select("*").order("score", { ascending: false })

  const rows = (data as ScoreRow[]) ?? []

  // 유저별 최고 점수 하나만 남기기
  const seen = new Set<string>()
  return rows
    .filter((row) => {
      if (seen.has(row.user_id)) return false
      seen.add(row.user_id)
      return true
    })
    .slice(0, limit)
}

export const insertScore = async (
  userId: string,
  userName: string,
  userAvatar: string | null,
  score: number,
  round: number,
  totalTime: number
): Promise<void> => {
  await supabase.from("scores").insert({
    user_id: userId,
    user_name: userName,
    user_avatar: userAvatar,
    score,
    round,
    total_time: totalTime
  })
}

export interface SpeedScoreRow {
  id: string
  user_id: string
  user_name: string
  user_avatar: string | null
  score: number
  tpm: number
  accuracy: number
  duration: number
  completed: number
  created_at: string
}

export const insertSpeedScore = async (
  userId: string,
  userName: string,
  userAvatar: string | null,
  score: number,
  tpm: number,
  accuracy: number,
  duration: number,
  completed: number
): Promise<void> => {
  await supabase.from("speed_scores").insert({
    user_id: userId,
    user_name: userName,
    user_avatar: userAvatar,
    score,
    tpm,
    accuracy,
    duration,
    completed
  })
}

export const fetchTopSpeedScores = async (
  duration?: number,
  limit = 20
): Promise<SpeedScoreRow[]> => {
  let query = supabase.from("speed_scores").select("*").order("score", { ascending: false })

  if (duration !== undefined) {
    query = query.eq("duration", duration)
  }

  const { data } = await query
  const rows = (data as SpeedScoreRow[]) ?? []

  const seen = new Set<string>()
  return rows
    .filter((row) => {
      if (seen.has(row.user_id)) return false
      seen.add(row.user_id)
      return true
    })
    .slice(0, limit)
}
