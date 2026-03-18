import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { fetchTopScores, ScoreRow } from "../lib/supabase"

const fallbackAvatar = (userId: string): string =>
  `https://api.dicebear.com/7.x/thumbs/svg?seed=${userId}`

export default function RankingPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [scores, setScores] = useState<ScoreRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTopScores().then((data) => {
      setScores(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="ranking-page">
      <h1 className="ranking-title">랭킹</h1>

      {loading ? (
        <p className="ranking-loading">불러오는 중...</p>
      ) : (
        <div className="ranking-list">
          {scores.map((row, i) => (
            <div key={row.id} className={`ranking-row ${i < 3 ? "ranking-top" : ""}`}>
              <span className="ranking-pos">{i + 1}</span>
              <img
                className="ranking-avatar"
                src={row.user_avatar ?? fallbackAvatar(row.user_id)}
                alt=""
              />
              <span className="ranking-name">{row.user_name}</span>
              <span className="ranking-score">{row.score}P</span>
              <span className="ranking-meta">
                {row.round} Round · {row.total_time}s
              </span>
            </div>
          ))}
          {scores.length === 0 && <p className="ranking-empty">아직 기록이 없어요</p>}
        </div>
      )}

      <button className="back-btn" onClick={() => navigate("/")}>
        ← 홈으로
      </button>
    </div>
  )
}
