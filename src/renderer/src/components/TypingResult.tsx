import { useNavigate } from "react-router-dom"
import { SongResult, TypingStats } from "../types"

interface TypingResultProps {
  song: SongResult
  stats: TypingStats
}

export default function TypingResult({ song, stats }: TypingResultProps): React.JSX.Element {
  const navigate = useNavigate()

  return (
    <div className="page-screen">
      <div className="result-card">
        <h2>완료! 🎉</h2>
        <p className="song-meta">
          {song.title} — {song.artist}
        </p>
        <div className="stat-grid">
          <div className="stat-box">
            <span className="stat-value">{stats.wpm}</span>
            <span className="stat-label">WPM</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{stats.accuracy}%</span>
            <span className="stat-label">정확도</span>
          </div>
        </div>
        <button className="game-exit-btn" onClick={() => navigate("/")}>
          ← 홈으로
        </button>
      </div>
    </div>
  )
}
