import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import proverbsData from "../data/proverbs.json"
import { SpeedText } from "../types"

type Tab = "proverb" | "news"
const DURATIONS = [30, 60] as const

export default function SpeedSelectPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>("proverb")
  const [duration, setDuration] = useState<30 | 60>(60)
  const [newsList, setNewsList] = useState<string[] | null>(null)
  const [newsError, setNewsError] = useState("")

  const newsLoading = tab === "news" && newsList === null && !newsError

  useEffect(() => {
    if (tab !== "news" || newsList !== null) return
    let cancelled = false
    window.api.speed
      .getNews()
      .then((titles: string[]) => {
        if (!cancelled) setNewsList(titles)
      })
      .catch(() => {
        if (!cancelled) setNewsError("뉴스를 불러오지 못했습니다.")
      })
    return () => {
      cancelled = true
    }
  }, [tab, newsList])

  const handleStart = (): void => {
    let texts: SpeedText[]
    if (tab === "proverb") {
      texts = [...proverbsData]
        .sort(() => Math.random() - 0.5)
        .map((p) => ({ text: p.text, meaning: p.meaning, source: "proverb" as const }))
    } else {
      if (!newsList || newsList.length === 0) return
      texts = [...newsList]
        .sort(() => Math.random() - 0.5)
        .map((text) => ({ text, source: "news" as const }))
    }
    navigate("/speed/game", { state: { texts, duration } })
  }

  const canStart = tab === "proverb" || (!newsLoading && newsList !== null && newsList.length > 0)

  return (
    <div className="speed-select-page">
      <button className="game-exit-btn" onClick={() => navigate("/")}>
        ← 뒤로
      </button>

      <h1 className="speed-select-title">스피드 타이핑</h1>

      <div className="speed-tabs">
        <button
          className={`speed-tab${tab === "proverb" ? " speed-tab--active" : ""}`}
          onClick={() => setTab("proverb")}
        >
          속담
        </button>
        <button
          className={`speed-tab${tab === "news" ? " speed-tab--active" : ""}`}
          onClick={() => setTab("news")}
        >
          뉴스
        </button>
      </div>

      {tab === "news" && newsLoading && <p className="loading-msg">뉴스 불러오는 중...</p>}
      {tab === "news" && newsError && <p className="error-msg">{newsError}</p>}

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

      <button className="game-btn" onClick={handleStart} disabled={!canStart}>
        시작하기
      </button>

      <button className="back-btn" onClick={() => navigate("/speed/ranking")}>
        랭킹 보기
      </button>
    </div>
  )
}
