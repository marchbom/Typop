import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { fetchTopScores, ScoreRow, fetchTopSpeedScores, SpeedScoreRow } from "../lib/supabase"

type GameTab = "artist" | "speed"
const DURATIONS = [30, 60] as const

const fallbackAvatar = (userId: string): string =>
  `https://api.dicebear.com/7.x/thumbs/svg?seed=${userId}`

export default function RankingPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [gameTab, setGameTab] = useState<GameTab>("artist")

  // 가사 게임 랭킹
  const [scores, setScores] = useState<ScoreRow[]>([])
  const [lyricsLoading, setLyricsLoading] = useState(true)

  // 스피드 게임 랭킹
  const [duration, setDuration] = useState<30 | 60>(60)
  const [speedCache, setSpeedCache] = useState<Partial<Record<number, SpeedScoreRow[]>>>({})
  const speedScores = speedCache[duration]
  const speedLoading = speedScores === undefined

  useEffect(() => {
    fetchTopScores().then((data) => {
      setScores(data)
      setLyricsLoading(false)
    })
  }, [])

  useEffect(() => {
    if (gameTab !== "speed" || speedCache[duration] !== undefined) return
    let cancelled = false
    fetchTopSpeedScores(duration).then((data) => {
      if (!cancelled) setSpeedCache((prev) => ({ ...prev, [duration]: data }))
    })
    return () => {
      cancelled = true
    }
  }, [gameTab, duration, speedCache])

  return (
    <div className="ranking-page">
      <h1 className="ranking-title">랭킹</h1>

      <div className="speed-tabs">
        <button
          className={`speed-tab${gameTab === "artist" ? " speed-tab--active" : ""}`}
          onClick={() => setGameTab("artist")}
        >
          아티스트 게임
        </button>
        <button
          className={`speed-tab${gameTab === "speed" ? " speed-tab--active" : ""}`}
          onClick={() => setGameTab("speed")}
        >
          스피드 타이핑
        </button>
      </div>

      {gameTab === "artist" && (
        <>
          {lyricsLoading ? (
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
        </>
      )}

      {gameTab === "speed" && (
        <>
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

          {speedLoading ? (
            <p className="ranking-loading">불러오는 중...</p>
          ) : (
            <div className="ranking-list">
              {speedScores.map((row, i) => (
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
              {speedScores.length === 0 && <p className="ranking-empty">아직 기록이 없어요</p>}
            </div>
          )}
        </>
      )}

      <button className="back-btn" onClick={() => navigate("/")}>
        ← 홈으로
      </button>
    </div>
  )
}
