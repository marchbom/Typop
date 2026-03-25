import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { fetchTopSpeedScores, SpeedScoreRow } from "../lib/supabase"

const DURATIONS = [30, 60] as const
const fallbackAvatar = (userId: string): string =>
  `https://api.dicebear.com/7.x/thumbs/svg?seed=${userId}`

export default function SpeedRankingPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [duration, setDuration] = useState<30 | 60>(60)
  const [cache, setCache] = useState<Partial<Record<number, SpeedScoreRow[]>>>({})
  const scores = cache[duration]
  const loading = scores === undefined

  useEffect(() => {
    if (cache[duration] !== undefined) return
    let cancelled = false
    fetchTopSpeedScores(duration).then((data) => {
      if (!cancelled) setCache((prev) => ({ ...prev, [duration]: data }))
    })
    return () => {
      cancelled = true
    }
  }, [duration, cache])

  return (
    <div className="ranking-page">
      <h1 className="ranking-title">스피드 랭킹</h1>

      <div className="speed-duration-btns">
        {DURATIONS.map((d) => (
          <button
            key={d}
            className={`speed-duration-btn${duration === d ? " speed-duration-btn--active" : ""}`}
            onClick={() => setDuration(d)}
          >
            {d}초
          </button>
        ))}
      </div>

      {loading ? (
        <p className="ranking-loading">불러오는 중...</p>
      ) : (
        <div className="ranking-list">
          {scores.map((row, i) => (
            <div key={row.id} className={`ranking-row${i < 3 ? " ranking-top" : ""}`}>
              <span className="ranking-pos">{i + 1}</span>
              <img
                className="ranking-avatar"
                src={row.user_avatar ?? fallbackAvatar(row.user_id)}
                alt=""
              />
              <span className="ranking-name">{row.user_name}</span>

              <span className="ranking-meta">
                {row.tpm} 타/분 · {row.completed}문장
              </span>
            </div>
          ))}
          {scores.length === 0 && <p className="ranking-empty">아직 기록이 없어요</p>}
        </div>
      )}

      <div className="exit-confirm-btns">
        <button className="back-btn" onClick={() => navigate("/speed")}>
          ← 스피드 타이핑
        </button>
        <button className="back-btn" onClick={() => navigate("/")}>
          홈으로
        </button>
      </div>
    </div>
  )
}
