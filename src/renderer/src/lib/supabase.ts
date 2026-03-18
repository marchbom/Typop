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
  const { data } = await supabase
    .from("scores")
    .select("*")
    .order("score", { ascending: false })
    .limit(limit)
  return (data as ScoreRow[]) ?? []
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
